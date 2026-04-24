import React from 'react';
import { render, act, fireEvent } from '@testing-library/react';
import LaunchTransition, { launchToDashboard } from '../LaunchTransition';

// Mock useRouter
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('LaunchTransition', () => {
  let requestAnimationFrameSpy: jest.SpyInstance;
  let cancelAnimationFrameSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    requestAnimationFrameSpy = jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      return setTimeout(() => cb(performance.now()), 16) as unknown as number;
    });
    cancelAnimationFrameSpy = jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(clearTimeout);
    
    // Mock canvas
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
      clearRect: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      lineTo: jest.fn(),
      stroke: jest.fn(),
      setTransform: jest.fn(),
      fillRect: jest.fn(),
      createLinearGradient: jest.fn(() => ({
        addColorStop: jest.fn(),
      })),
    })) as any;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('renders nothing when inactive', () => {
    const { container } = render(<LaunchTransition />);
    expect(container).toBeEmptyDOMElement();
  });

  it('handles launchToDashboard utility', () => {
    const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');
    launchToDashboard({ href: '/dashboard', originX: 100, originY: 100 });
    
    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'contextweaver:launch',
        detail: expect.objectContaining({
          href: '/dashboard',
          originX: 100,
          originY: 100,
        })
      })
    );
  });

  it('activates and animates on event', () => {
    render(<LaunchTransition />);
    
    act(() => {
      launchToDashboard({ originX: 0, originY: 0 });
    });
    
    // Fast forward through all timers
    act(() => {
      jest.runAllTimers();
    });
  });

  it('handles reduced motion', () => {
    // Mock matchMedia for reduced motion
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: jest.fn(), // Deprecated
      removeListener: jest.fn(), // Deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    render(<LaunchTransition />);
    
    act(() => {
      launchToDashboard({});
    });
    
    // Fast forward through timers for reduced motion
    act(() => {
      jest.runAllTimers();
    });
    
    // Clean up mock
    delete (window as any).matchMedia;
  });

  it('handles null context gracefully during warp', () => {
    let callCount = 0;
    HTMLCanvasElement.prototype.getContext = jest.fn(() => {
      callCount++;
      if (callCount > 1) return null; // Null on the second call (inside step)
      return {
        clearRect: jest.fn(),
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        stroke: jest.fn(),
        setTransform: jest.fn(),
        fillRect: jest.fn(),
        createLinearGradient: jest.fn(() => ({
          addColorStop: jest.fn(),
        })),
      };
    }) as any;

    render(<LaunchTransition />);
    act(() => {
      launchToDashboard({});
      jest.advanceTimersByTime(16);
    });
  });

  it('handles warp with null canvas context at start', () => {
    HTMLCanvasElement.prototype.getContext = jest.fn(() => null) as any;
    render(<LaunchTransition />);
    act(() => {
      launchToDashboard({});
      jest.advanceTimersByTime(16);
    });
  });

  it('handles warp with unmounted canvas in step', () => {
    const { unmount } = render(<LaunchTransition />);
    act(() => {
      launchToDashboard({});
    });
    unmount();
    act(() => {
      jest.advanceTimersByTime(16);
    });
  });

  it('handles reveal phase opacity branch', () => {
    render(<LaunchTransition />);
    act(() => {
      launchToDashboard({});
    });
    act(() => {
      jest.advanceTimersByTime(800);
    });
  });

  it('ignores events with no detail', () => {
    render(<LaunchTransition />);
    act(() => {
      window.dispatchEvent(new CustomEvent('contextweaver:launch', { detail: null }));
    });
  });

  it('ignores overlapping launch events', () => {
    render(<LaunchTransition />);
    act(() => {
      launchToDashboard({});
      launchToDashboard({});
    });
    act(() => {
      jest.runAllTimers();
    });
  });

  it('does not double-launch when active', () => {
    render(<LaunchTransition />);
    act(() => {
      launchToDashboard({});
    });
    act(() => {
      launchToDashboard({});
    });
  });
});
