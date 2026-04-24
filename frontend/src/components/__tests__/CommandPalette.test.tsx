/* eslint-disable */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import CommandPalette, { CommandPaletteHint } from '../CommandPalette';

// Mock useRouter
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock framer-motion to skip animations
jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div: React.forwardRef(({ children, onAnimationStart, onAnimationComplete, exit, initial, animate, transition, ...props }: any, ref: any) => (
        <div ref={ref} {...props}>{children}</div>
      )),
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

describe('CommandPalette', () => {
  let mockPush: jest.Mock;

  beforeEach(() => {
    mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    
    // Clear any previous events or mocks
    jest.clearAllMocks();
    
    // Create portal root if necessary
    if (!document.getElementById('modal-root')) {
      const root = document.createElement('div');
      root.setAttribute('id', 'modal-root');
      document.body.appendChild(root);
    }
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does not render when closed', () => {
    render(<CommandPalette />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens on contextweaver:palette event', async () => {
    render(<CommandPalette />);
    
    act(() => {
      window.dispatchEvent(new CustomEvent('contextweaver:palette'));
    });
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type a command or search...')).toBeInTheDocument();
  });

  it('opens on meta+k shortcut', () => {
    render(<CommandPalette />);
    
    act(() => {
      fireEvent.keyDown(window, { key: 'k', metaKey: true });
    });
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('opens on ctrl+k shortcut', () => {
    render(<CommandPalette />);
    
    act(() => {
      fireEvent.keyDown(window, { key: 'k', ctrlKey: true });
    });
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('filters commands by query', async () => {
    render(<CommandPalette />);
    
    act(() => {
      window.dispatchEvent(new CustomEvent('contextweaver:palette'));
    });

    const input = screen.getByPlaceholderText('Type a command or search...');
    
    act(() => {
      fireEvent.change(input, { target: { value: 'Dashboard' } });
    });

    // Should show Dashboard item
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Live pipeline view')).toBeInTheDocument();
    
    // Should not show Home
    expect(screen.queryByText('Home')).not.toBeInTheDocument();
  });

  it('shows no commands message when query does not match', () => {
    render(<CommandPalette />);
    
    act(() => {
      window.dispatchEvent(new CustomEvent('contextweaver:palette'));
    });

    const input = screen.getByPlaceholderText('Type a command or search...');
    
    act(() => {
      fireEvent.change(input, { target: { value: 'xyz123' } });
    });

    expect(screen.getByText('No commands match "xyz123"')).toBeInTheDocument();
  });

  it('navigates with arrow keys and selects with enter', async () => {
    render(<CommandPalette />);
    
    act(() => {
      window.dispatchEvent(new CustomEvent('contextweaver:palette'));
    });

    const input = screen.getByPlaceholderText('Type a command or search...');
    
    // Filter to ensure specific items are present
    act(() => {
      fireEvent.change(input, { target: { value: 'Nav' } });
    });

    // Press down arrow twice
    act(() => {
      fireEvent.keyDown(input, { key: 'ArrowDown' });
    });
    act(() => {
      fireEvent.keyDown(input, { key: 'ArrowDown' });
    });

    // Press up arrow once
    act(() => {
      fireEvent.keyDown(input, { key: 'ArrowUp' });
    });

    // Press enter to select the second item (which should be dashboard in the nav filter)
    act(() => {
      fireEvent.keyDown(input, { key: 'Enter' });
    });

    expect(mockPush).toHaveBeenCalledWith('/dashboard');
    
    // Should close after selection
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes on escape key', async () => {
    render(<CommandPalette />);
    
    act(() => {
      window.dispatchEvent(new CustomEvent('contextweaver:palette'));
    });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    
    const input = screen.getByPlaceholderText('Type a command or search...');
    
    act(() => {
      fireEvent.keyDown(input, { key: 'Escape' });
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('ignores unhandled keys', async () => {
    render(<CommandPalette />);
    
    act(() => {
      window.dispatchEvent(new CustomEvent('contextweaver:palette'));
    });

    const input = screen.getByPlaceholderText('Type a command or search...');
    
    act(() => {
      fireEvent.keyDown(input, { key: 'Shift' });
    });

    // Should still be open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('ArrowUp stops at 0', async () => {
    render(<CommandPalette />);
    
    act(() => {
      window.dispatchEvent(new CustomEvent('contextweaver:palette'));
    });

    const input = screen.getByPlaceholderText('Type a command or search...');
    
    act(() => {
      fireEvent.keyDown(input, { key: 'ArrowUp' });
    });

    // Active item should remain the first one
    const firstItem = screen.getByText('Home').closest('button');
    expect(firstItem?.className).toContain('bg-cyan-500/10 text-white');
  });

  it('executes item perform on click', async () => {
    render(<CommandPalette />);
    
    act(() => {
      window.dispatchEvent(new CustomEvent('contextweaver:palette'));
    });

    // Find the dashboard button
    const dashboardBtn = screen.getByText('Dashboard').closest('button');
    expect(dashboardBtn).not.toBeNull();
    
    act(() => {
      fireEvent.click(dashboardBtn!);
    });

    expect(mockPush).toHaveBeenCalledWith('/dashboard');
    
    // Reopen and test Home
    act(() => window.dispatchEvent(new CustomEvent('contextweaver:palette')));
    act(() => fireEvent.click(screen.getByText('Home').closest('button')!));
    expect(mockPush).toHaveBeenCalledWith('/');
    
    // Reopen and test History
    act(() => window.dispatchEvent(new CustomEvent('contextweaver:palette')));
    act(() => fireEvent.click(screen.getByText('Query History').closest('button')!));
    expect(mockPush).toHaveBeenCalledWith('/history');
    
    // Reopen and test Settings
    act(() => window.dispatchEvent(new CustomEvent('contextweaver:palette')));
    act(() => fireEvent.click(screen.getByText('Router Settings').closest('button')!));
    expect(mockPush).toHaveBeenCalledWith('/settings');
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('executes custom perform functions (e.g. shortcuts, run pipeline, github)', () => {
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent');
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
    
    render(<CommandPalette />);
    
    act(() => {
      window.dispatchEvent(new CustomEvent('contextweaver:palette'));
    });

    const shortcutsBtn = screen.getByText('Show Keyboard Shortcuts').closest('button');
    act(() => { fireEvent.click(shortcutsBtn!); });
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(CustomEvent));
    expect(dispatchSpy.mock.calls.some(call => call[0].type === 'contextweaver:shortcuts')).toBe(true);

    // Reopen
    act(() => { window.dispatchEvent(new CustomEvent('contextweaver:palette')); });
    
    const runBtn = screen.getByText('Run Annotation Pipeline').closest('button');
    act(() => { fireEvent.click(runBtn!); });
    expect(dispatchSpy.mock.calls.some(call => call[0].type === 'contextweaver:run')).toBe(true);
    
    // Reopen
    act(() => { window.dispatchEvent(new CustomEvent('contextweaver:palette')); });
    
    const githubBtn = screen.getByText('Open GitHub Repository').closest('button');
    act(() => { fireEvent.click(githubBtn!); });
    expect(openSpy).toHaveBeenCalledWith('https://github.com/edycutjong/contextweaver', '_blank', 'noopener,noreferrer');

    dispatchSpy.mockRestore();
    openSpy.mockRestore();
  });

  it('closes on background click', async () => {
    render(<CommandPalette />);
    
    act(() => {
      window.dispatchEvent(new CustomEvent('contextweaver:palette'));
    });

    const dialog = screen.getByRole('dialog');
    
    act(() => {
      fireEvent.click(dialog);
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not close when clicking inside modal content', async () => {
    render(<CommandPalette />);
    
    act(() => {
      window.dispatchEvent(new CustomEvent('contextweaver:palette'));
    });

    const input = screen.getByPlaceholderText('Type a command or search...');
    
    act(() => {
      fireEvent.click(input);
    });

    // Should still be open
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('updates active item on hover', () => {
    render(<CommandPalette />);
    
    act(() => {
      window.dispatchEvent(new CustomEvent('contextweaver:palette'));
    });

    const dashboardBtn = screen.getByText('Dashboard').closest('button');
    
    act(() => {
      fireEvent.mouseEnter(dashboardBtn!);
    });

    // Check if the item gets the active styling class
    expect(dashboardBtn?.className).toContain('bg-cyan-500/10 text-white');
  });

  it('scrolls container to keep active row in view when moving down', () => {
    render(<CommandPalette />);
    
    act(() => {
      window.dispatchEvent(new CustomEvent('contextweaver:palette'));
    });

    // Mock layout properties on the list container and item
    const input = screen.getByPlaceholderText('Type a command or search...');
    const listbox = document.querySelector('.overflow-y-auto') as HTMLElement;
    
    Object.defineProperty(listbox, 'scrollTop', { value: 0, writable: true });
    Object.defineProperty(listbox, 'clientHeight', { value: 100, writable: true });
    
    // Mock offsetTop and offsetHeight for items using prototype to ensure new queries get the values
    const originalOffsetTop = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetTop');
    const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
    
    Object.defineProperty(HTMLElement.prototype, 'offsetTop', {
      get() {
        const idx = this.getAttribute('data-idx');
        if (idx !== null) return parseInt(idx) * 50;
        return 0;
      },
      configurable: true
    });
    
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      get() {
        if (this.hasAttribute('data-idx')) return 50;
        return 0;
      },
      configurable: true
    });

    // Move down multiple times to push the active item out of view
    act(() => {
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowDown' });
    });

    // Verify scrollTop was updated
    expect(listbox.scrollTop).toBeGreaterThan(0);
    
    // Cleanup prototype
    if (originalOffsetTop) Object.defineProperty(HTMLElement.prototype, 'offsetTop', originalOffsetTop);
    else delete (HTMLElement.prototype as any).offsetTop;
    
    if (originalOffsetHeight) Object.defineProperty(HTMLElement.prototype, 'offsetHeight', originalOffsetHeight);
    else delete (HTMLElement.prototype as any).offsetHeight;
  });
});

describe('CommandPaletteHint', () => {
  it('triggers contextweaver:palette event on click', () => {
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent');
    
    render(<CommandPaletteHint />);
    
    const btn = screen.getByRole('button', { name: 'Open command palette' });
    
    act(() => {
      fireEvent.click(btn);
    });

    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(CustomEvent));
    expect(dispatchSpy.mock.calls[0][0].type).toBe('contextweaver:palette');
    
    dispatchSpy.mockRestore();
  });
});
