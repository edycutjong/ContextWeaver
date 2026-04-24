import React from 'react';
import { render, act, fireEvent } from '@testing-library/react';
import StarField from '../StarField';

describe('StarField', () => {
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
      arc: jest.fn(),
      fill: jest.fn(),
      setTransform: jest.fn(),
    })) as any;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('renders and animates without crashing', () => {
    render(<StarField density={0.001} />);
    
    // Advance timers to trigger animation frame
    act(() => {
      jest.advanceTimersByTime(50);
    });
  });

  it('responds to resize events', () => {
    render(<StarField />);
    
    act(() => {
      global.innerWidth = 800;
      global.innerHeight = 600;
      fireEvent(window, new Event('resize'));
    });
  });

  it('responds to mouse movement', () => {
    render(<StarField />);
    
    act(() => {
      fireEvent.mouseMove(window, { clientX: 100, clientY: 100 });
      jest.advanceTimersByTime(50);
    });
  });

  it('handles launch custom events', () => {
    render(<StarField />);
    
    act(() => {
      window.dispatchEvent(new Event('contextweaver:launch-start'));
      jest.advanceTimersByTime(50); // should be paused
    });
    
    act(() => {
      window.dispatchEvent(new Event('contextweaver:launch-end'));
      jest.advanceTimersByTime(50); // should resume
    });
  });

  it('handles null context gracefully', () => {
    HTMLCanvasElement.prototype.getContext = jest.fn(() => null) as any;
    render(<StarField />);
  });

  it('handles stars wrapping around screen', () => {
    // Force initial positions out of bounds
    const originalRandom = Math.random;
    Math.random = jest.fn().mockReturnValue(1.5);
    render(<StarField density={0.001} />);
    
    act(() => {
      jest.advanceTimersByTime(50);
    });

    Math.random = jest.fn().mockReturnValue(-1.5);
    act(() => {
      jest.advanceTimersByTime(50);
    });

    Math.random = originalRandom;
  });

  it('unmounts cleanly', () => {
    const { unmount } = render(<StarField />);
    unmount();
    expect(cancelAnimationFrameSpy).toHaveBeenCalled();
  });
});
