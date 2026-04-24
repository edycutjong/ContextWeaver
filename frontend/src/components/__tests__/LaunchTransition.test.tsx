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
    
    // Fast forward through timers
    act(() => {
      jest.advanceTimersByTime(200); // Trigger nav
    });
    
    act(() => {
      jest.advanceTimersByTime(500); // Trigger reveal
    });
    
    act(() => {
      jest.advanceTimersByTime(500); // Trigger end
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
      jest.advanceTimersByTime(100); // nav
    });
    
    act(() => {
      jest.advanceTimersByTime(100); // reveal
    });
    
    act(() => {
      jest.advanceTimersByTime(300); // end
    });
    
    // Clean up mock
    delete (window as any).matchMedia;
  });
});
