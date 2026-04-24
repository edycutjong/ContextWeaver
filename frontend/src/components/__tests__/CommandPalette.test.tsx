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
