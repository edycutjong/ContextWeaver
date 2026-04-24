import React from 'react';
import { render, act, screen } from '@testing-library/react';
import ThroughputSparkline from '../ThroughputSparkline';

// Mock framer-motion to avoid animation issues
jest.mock('framer-motion', () => ({
  motion: {
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
}));

describe('ThroughputSparkline', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Mock performance.now
    jest.spyOn(performance, 'now').mockImplementation(() => Date.now());
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('renders correctly when inactive', () => {
    const { container } = render(<ThroughputSparkline value={0} active={false} />);
    expect(container).toBeInTheDocument();
  });

  it('updates points when active', () => {
    const { rerender } = render(<ThroughputSparkline value={100} active={true} />);
    
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    rerender(<ThroughputSparkline value={200} active={true} />);
    
    act(() => {
      jest.advanceTimersByTime(1000);
    });
  });

  it('decays points on tick when active', () => {
    render(<ThroughputSparkline value={100} active={true} />);
    
    act(() => {
      jest.advanceTimersByTime(600); // Trigger the interval
    });
  });

  it('handles zero capacity', () => {
    render(<ThroughputSparkline value={100} active={true} capacity={0} />);
    
    act(() => {
      jest.advanceTimersByTime(600);
    });
  });

  it("handles zero capacity gracefully", () => {
    const { container } = render(<ThroughputSparkline value={100} active={true} capacity={0} />);
    
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(container).toBeInTheDocument();
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
  });
});
