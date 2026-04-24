import React from 'react';
import { render, screen, act, fireEvent, waitFor } from '@testing-library/react';
import ToastLayer, { pushToast, ToastPayload } from '../ToastLayer';

// Mock framer-motion to skip animations
jest.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      div: React.forwardRef(({ children, layout, initial, animate, exit, transition, ...props }: any, ref: any) => (
        <div ref={ref} {...props}>{children}</div>
      )),
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

describe('ToastLayer', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Create portal root if necessary
    if (!document.getElementById('modal-root')) {
      const root = document.createElement('div');
      root.setAttribute('id', 'modal-root');
      document.body.appendChild(root);
    }
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('renders nothing initially', () => {
    render(<ToastLayer />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('renders a toast when pushToast is called', () => {
    render(<ToastLayer />);

    act(() => {
      pushToast({ title: 'Test Toast', description: 'This is a test', kind: 'success' });
    });

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Test Toast')).toBeInTheDocument();
    expect(screen.getByText('This is a test')).toBeInTheDocument();
  });

  it('auto-dismisses toasts after duration', async () => {
    render(<ToastLayer />);

    act(() => {
      pushToast({ title: 'Auto Dismiss', duration: 1000 });
    });

    expect(screen.getByText('Auto Dismiss')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(screen.queryByText('Auto Dismiss')).not.toBeInTheDocument();
  });

  it('does not auto-dismiss if duration is 0', () => {
    render(<ToastLayer />);

    act(() => {
      pushToast({ title: 'Persistent Toast', duration: 0 });
    });

    expect(screen.getByText('Persistent Toast')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(10000);
    });

    expect(screen.getByText('Persistent Toast')).toBeInTheDocument();
  });

  it('allows manual dismissal', async () => {
    render(<ToastLayer />);

    act(() => {
      pushToast({ title: 'Dismissable Toast', duration: 0 });
    });

    expect(screen.getByText('Dismissable Toast')).toBeInTheDocument();

    const closeButton = screen.getByRole('button', { name: 'Dismiss' });
    
    act(() => {
      fireEvent.click(closeButton);
    });

    expect(screen.queryByText('Dismissable Toast')).not.toBeInTheDocument();
  });

  it('limits to 4 toasts maximum', async () => {
    render(<ToastLayer />);

    act(() => {
      pushToast({ title: 'Toast 1', duration: 0 });
      pushToast({ title: 'Toast 2', duration: 0 });
      pushToast({ title: 'Toast 3', duration: 0 });
      pushToast({ title: 'Toast 4', duration: 0 });
      pushToast({ title: 'Toast 5', duration: 0 });
    });

    // Should only have the last 4 toasts
    expect(screen.queryByText('Toast 1')).not.toBeInTheDocument();
    expect(screen.getByText('Toast 2')).toBeInTheDocument();
    expect(screen.getByText('Toast 3')).toBeInTheDocument();
    expect(screen.getByText('Toast 4')).toBeInTheDocument();
    expect(screen.getByText('Toast 5')).toBeInTheDocument();
  });

  it('handles null event detail gracefully', () => {
    render(<ToastLayer />);
    
    act(() => {
      window.dispatchEvent(new CustomEvent('contextweaver:toast'));
    });
    
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
  
  it('assigns random id if not provided', () => {
    render(<ToastLayer />);
    
    act(() => {
      pushToast({ title: 'Random ID' });
    });
    
    expect(screen.getByText('Random ID')).toBeInTheDocument();
  });
  
  it('uses default kind and duration if not provided', async () => {
    render(<ToastLayer />);
    
    act(() => {
      pushToast({ title: 'Default Toast' });
    });
    
    expect(screen.getByText('Default Toast')).toBeInTheDocument();
    
    // Default duration is 3600
    act(() => {
      jest.advanceTimersByTime(3599);
    });
    expect(screen.getByText('Default Toast')).toBeInTheDocument();
    
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(screen.queryByText('Default Toast')).not.toBeInTheDocument();
  });

  it('renders different kinds of toasts', () => {
    render(<ToastLayer />);

    act(() => {
      pushToast({ title: 'Success', kind: 'success', duration: 1000 });
      pushToast({ title: 'Info', kind: 'info', duration: 1000 });
      pushToast({ title: 'Warning', kind: 'warning', duration: 1000 });
      pushToast({ title: 'Error', kind: 'error', duration: 1000 });
    });

    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Info')).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
  });
  
  it('does nothing when pushToast called in non-browser environment', () => {
    // Save original window
    const originalWindow = global.window;
    
    try {
      // @ts-ignore - Mocking absence of window
      delete global.window;
      
      // Should not throw
      expect(() => {
        pushToast({ title: 'Server Side' });
      }).not.toThrow();
    } finally {
      // Restore window
      global.window = originalWindow;
    }
  });
});
