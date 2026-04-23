import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import HistoryPage from '../page';

// Mock framer-motion
jest.mock('framer-motion', () => {
  const MockDiv = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ children, ...props }, ref) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { whileHover, whileTap, layoutId, initial, animate, transition, ...rest } = props as any;
    return <div ref={ref} {...rest}>{children}</div>;
  });
  MockDiv.displayName = 'motion.div';

  const MockTr = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(({ children, ...props }, ref) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { whileHover, whileTap, layoutId, initial, animate, transition, ...rest } = props as any;
    return <tr ref={ref} {...rest}>{children}</tr>;
  });
  MockTr.displayName = 'motion.tr';

  return {
    motion: {
      div: MockDiv,
      tr: MockTr,
    },
    useMotionValue: (init: number) => {
      let val = init;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
      const cbs: Function[] = [];
      return {
        get: () => val,
        set: (v: number) => { val = v; cbs.forEach(cb => cb(v)); },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
        on: (_ev: string, cb: Function) => { cbs.push(cb); return () => {}; },
        simulateChange: (v: number) => cbs.forEach(cb => cb(v)),
      };
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    animate: (val: any, target: number) => {
      if (val.simulateChange) val.simulateChange(target);
      return { stop: jest.fn() };
    },
  };
});

describe('HistoryPage', () => {
  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(<HistoryPage />);
    expect(getByText('Query History')).toBeInTheDocument();
    expect(getByPlaceholderText('Search history...')).toBeInTheDocument();
  });

  it('filters history based on search', () => {
    const { getByPlaceholderText, getByText, queryByText } = render(<HistoryPage />);
    const searchInput = getByPlaceholderText('Search history...');
    
    // Initially, multiple items exist
    expect(getByText('What are the core features of FlagOS?')).toBeInTheDocument();
    expect(getByText('What is the capital of France?')).toBeInTheDocument();
    
    // Search for specific query
    fireEvent.change(searchInput, { target: { value: 'FlagOS' } });
    
    expect(getByText('What are the core features of FlagOS?')).toBeInTheDocument();
    expect(queryByText('What is the capital of France?')).not.toBeInTheDocument();
  });

  it('shows no results message when search matches nothing', () => {
    const { getByPlaceholderText, getByText } = render(<HistoryPage />);
    const searchInput = getByPlaceholderText('Search history...');
    
    fireEvent.change(searchInput, { target: { value: 'nonexistentquery123' } });
    
    expect(getByText('No queries match "nonexistentquery123"')).toBeInTheDocument();
  });
  
  it('renders AnimatedStat component correctly with decimals and suffix', () => {
    // The AnimatedStat component is rendered with success rate (decimals=1, suffix='%')
    // We already mocked framer-motion to simulate the change immediately.
    // So the values should just be rendered in the document.
    const { getAllByText } = render(<HistoryPage />);
    
    // Check if the success rate percentage is displayed correctly
    expect(getAllByText(/%/).length).toBeGreaterThan(0);
  });
});
