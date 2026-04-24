/* eslint-disable */
import React from 'react';
import { render, act } from '@testing-library/react';
import ConfettiBurst from '../ConfettiBurst';

describe('ConfettiBurst', () => {
  let mockContext: unknown;
  let rafSpy: jest.SpyInstance;
  let cafSpy: jest.SpyInstance;
  
  beforeEach(() => {
    jest.useFakeTimers();
    
    // Mock getBoundingClientRect
    window.HTMLCanvasElement.prototype.getBoundingClientRect = () => ({
      width: 500,
      height: 500,
      top: 0,
      left: 0,
      right: 500,
      bottom: 500,
      x: 0,
      y: 0,
      toJSON: () => {}
    });

    // Mock Canvas Context
    mockContext = {
      setTransform: jest.fn(),
      clearRect: jest.fn(),
      save: jest.fn(),
      translate: jest.fn(),
      rotate: jest.fn(),
      fillRect: jest.fn(),
      beginPath: jest.fn(),
      arc: jest.fn(),
      fill: jest.fn(),
      restore: jest.fn(),
      globalAlpha: 1,
      fillStyle: '',
      shadowColor: '',
      shadowBlur: 0
    };
    
    window.HTMLCanvasElement.prototype.getContext = jest.fn(() => mockContext) as unknown;
    
    // Setup RAF mocks
    let rafCallbacks: FrameRequestCallback[] = [];
    let frameCount = 0;
    
    rafSpy = jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCallbacks.push(cb);
      frameCount++;
      return frameCount;
    });
    
    cafSpy = jest.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
      // Just a mock, we don't strictly need to remove it from the array for these tests
    });

    // Helper to manually run the next frame
    (global as unknown).triggerRaf = () => {
      const callbacksToRun = [...rafCallbacks];
      rafCallbacks = [];
      callbacksToRun.forEach(cb => cb(performance.now()));
    };
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    delete (global as unknown).triggerRaf;
  });

  it('renders canvas element', () => {
    const { container } = render(<ConfettiBurst trigger={0} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveClass('pointer-events-none');
  });

  it('does nothing when trigger is 0', () => {
    render(<ConfettiBurst trigger={0} />);
    expect(window.HTMLCanvasElement.prototype.getContext).not.toHaveBeenCalled();
  });

  it('initializes canvas and particles when trigger changes', () => {
    const { rerender } = render(<ConfettiBurst trigger={0} />);
    
    rerender(<ConfettiBurst trigger={1} />);
    
    expect(window.HTMLCanvasElement.prototype.getContext).toHaveBeenCalledWith('2d');
    expect(mockContext.setTransform).toHaveBeenCalled();
    expect(rafSpy).toHaveBeenCalled();
  });

  it('runs animation loop until all particles die', () => {
    const { rerender } = render(<ConfettiBurst trigger={0} />);
    
    rerender(<ConfettiBurst trigger={1} />);
    
    // First frame starts the loop
    expect(mockContext.clearRect).not.toHaveBeenCalled();
    
    // Trigger one frame
    act(() => {
      (global as unknown).triggerRaf();
    });
    
    // Clear rect should have been called
    expect(mockContext.clearRect).toHaveBeenCalled();
    expect(mockContext.fillRect).toHaveBeenCalled(); // At least some rects
    expect(mockContext.arc).toHaveBeenCalled(); // At least some circles
    
    // Particles have random life spans (between 80 and 140).
    // Let's advance it enough times to kill all particles.
    act(() => {
      for (let i = 0; i < 150; i++) {
        (global as unknown).triggerRaf();
      }
    });
    
    // After all particles are dead, rafRef is set to null, and clearRect is called one last time with no new RAF.
    const currentRafCalls = rafSpy.mock.calls.length;
    
    act(() => {
      (global as unknown).triggerRaf(); // If there were unknown pending
    });
    
    expect(rafSpy.mock.calls.length).toBe(currentRafCalls); // No new RAFs scheduled
  });

  it('cleans up RAF on unmount', () => {
    const { rerender, unmount } = render(<ConfettiBurst trigger={0} />);
    rerender(<ConfettiBurst trigger={1} />);
    
    expect(cafSpy).not.toHaveBeenCalled();
    
    unmount();
    
    expect(cafSpy).toHaveBeenCalled();
  });

  it('handles null canvas gracefully', () => {
    // Override getContext to return null to test edge case
    window.HTMLCanvasElement.prototype.getContext = jest.fn(() => null) as unknown;
    
    const { rerender } = render(<ConfettiBurst trigger={0} />);
    rerender(<ConfettiBurst trigger={1} />);
    
    expect(rafSpy).not.toHaveBeenCalled();
  });

  it('handles undefined devicePixelRatio gracefully', () => {
    const originalDpr = window.devicePixelRatio;
    Object.defineProperty(window, 'devicePixelRatio', { value: undefined, writable: true });
    
    const { rerender } = render(<ConfettiBurst trigger={0} />);
    rerender(<ConfettiBurst trigger={1} />);
    
    expect(mockContext.setTransform).toHaveBeenCalledWith(1, 0, 0, 1, 0, 0);
    
    Object.defineProperty(window, 'devicePixelRatio', { value: originalDpr, writable: true });
  });

  it('handles missing canvas ref gracefully', () => {
    const originalRef = React.useRef;
    jest.spyOn(React, 'useRef').mockImplementation((initialValue) => {
      // If it's a canvas ref, return an object whose current is always null
      if (initialValue === null) {
        return {
          get current() { return null; },
          set current(_) {}
        };
      }
      return originalRef(initialValue);
    });

    const { rerender } = render(<ConfettiBurst trigger={0} />);
    rerender(<ConfettiBurst trigger={1} />);
    
    // getContext should not be called since canvas is null
    expect(window.HTMLCanvasElement.prototype.getContext).not.toHaveBeenCalled();
    jest.restoreAllMocks();
  });

  it('cancels pending animation frames on rapid re-triggers', () => {
    const { rerender } = render(<ConfettiBurst trigger={0} />);
    rerender(<ConfettiBurst trigger={1} />);
    
    // We expect 1 call to requestAnimationFrame
    expect(rafSpy).toHaveBeenCalledTimes(1);
    
    // Trigger again rapidly
    rerender(<ConfettiBurst trigger={2} />);
    
    // It should have cancelled the previous frame
    expect(cafSpy).toHaveBeenCalled();
    // And requested a new one
    expect(rafSpy).toHaveBeenCalledTimes(2);
  });

  it('returns early if trigger is the same as last trigger', () => {
    const { rerender } = render(<ConfettiBurst trigger={0} />);
    rerender(<ConfettiBurst trigger={1} />);
    
    const rafCalls = rafSpy.mock.calls.length;
    
    // Rerender with the same trigger
    rerender(<ConfettiBurst trigger={1} />);
    
    // RAF should not have been called again
    expect(rafSpy.mock.calls.length).toBe(rafCalls);
  });
});
