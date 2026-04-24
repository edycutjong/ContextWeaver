import React from 'react';
import { render, act, fireEvent } from '@testing-library/react';
import KeyboardShortcuts from '../KeyboardShortcuts';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('KeyboardShortcuts', () => {
  let dispatchEventSpy: jest.SpyInstance;
  let originalPathname: string;
  
  beforeAll(() => {
    originalPathname = window.location.pathname;
  });

  afterAll(() => {
    window.history.pushState({}, '', originalPathname);
  });
  
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');
    window.history.pushState({}, '', '/dashboard');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('renders nothing', () => {
    const { container } = render(<KeyboardShortcuts />);
    expect(container).toBeEmptyDOMElement();
  });

  it('ignores events with modifiers', () => {
    render(<KeyboardShortcuts />);
    fireEvent.keyDown(window, { key: 'g', metaKey: true });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('ignores events from editable elements', () => {
    render(<KeyboardShortcuts />);
    
    const input = document.createElement('input');
    document.body.appendChild(input);
    fireEvent.keyDown(input, { key: 'g' });
    
    expect(mockPush).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it('handles navigation shortcuts: g -> d', () => {
    render(<KeyboardShortcuts />);
    
    fireEvent.keyDown(window, { key: 'g' });
    fireEvent.keyDown(window, { key: 'd' });
    
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('handles navigation shortcuts: g -> h', () => {
    render(<KeyboardShortcuts />);
    
    fireEvent.keyDown(window, { key: 'g' });
    fireEvent.keyDown(window, { key: 'h' });
    
    expect(mockPush).toHaveBeenCalledWith('/history');
  });

  it('handles navigation shortcuts: g -> s', () => {
    render(<KeyboardShortcuts />);
    
    fireEvent.keyDown(window, { key: 'g' });
    fireEvent.keyDown(window, { key: 's' });
    
    expect(mockPush).toHaveBeenCalledWith('/settings');
  });

  it('handles navigation shortcuts: g -> l', () => {
    render(<KeyboardShortcuts />);
    
    fireEvent.keyDown(window, { key: 'g' });
    fireEvent.keyDown(window, { key: 'l' });
    
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('cancels pending g on invalid second key', () => {
    render(<KeyboardShortcuts />);
    
    fireEvent.keyDown(window, { key: 'g' });
    fireEvent.keyDown(window, { key: 'x' });
    
    // Attempt d afterwards, it should not navigate because g was cancelled
    fireEvent.keyDown(window, { key: 'd' });
    
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('clears pending g on timeout', () => {
    render(<KeyboardShortcuts />);
    
    fireEvent.keyDown(window, { key: 'g' });
    
    act(() => {
      jest.advanceTimersByTime(1000); // Wait > 900ms
    });
    
    fireEvent.keyDown(window, { key: 'd' });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('triggers run event on r', () => {
    render(<KeyboardShortcuts />);
    
    fireEvent.keyDown(window, { key: 'r' });
    
    const calls = dispatchEventSpy.mock.calls;
    const hasRunEvent = calls.some(call => call[0].type === 'contextweaver:run');
    expect(hasRunEvent).toBe(true);
  });

  it('ignores r if not on dashboard', () => {
    window.history.pushState({}, '', '/history');
    
    render(<KeyboardShortcuts />);
    
    fireEvent.keyDown(window, { key: 'r' });
    
    const calls = dispatchEventSpy.mock.calls;
    const hasRunEvent = calls.some(call => call[0].type === 'contextweaver:run');
    expect(hasRunEvent).toBe(false);
  });

  it('cleans up listeners on unmount', () => {
    const { unmount } = render(<KeyboardShortcuts />);
    
    unmount();
    
    fireEvent.keyDown(window, { key: 'g' });
    fireEvent.keyDown(window, { key: 'd' });
    
    expect(mockPush).not.toHaveBeenCalled();
  });
});
