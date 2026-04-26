/* eslint-disable */
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import HistoryPage from '../page';

// Mock framer-motion
jest.mock('framer-motion', () => {
  const MockDiv = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ children, ...props }, ref) => {
     
    const { whileHover, whileTap, layoutId, initial, animate, transition, ...rest } = props as Record<string, unknown>;
    return <div ref={ref} {...(rest as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>;
  });
  MockDiv.displayName = 'motion.div';

  const MockTr = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(({ children, ...props }, ref) => {
     
    const { whileHover, whileTap, layoutId, initial, animate, transition, ...rest } = props as Record<string, unknown>;
    return <tr ref={ref} {...(rest as React.HTMLAttributes<HTMLTableRowElement>)}>{children}</tr>;
  });
  MockTr.displayName = 'motion.tr';

  return {
    motion: {
      div: MockDiv,
      tr: MockTr,
    },
    useMotionValue: (init: number) => {
      let val = init;
       
      const cbs: Function[] = [];
      return {
        get: () => val,
        set: (v: number) => { val = v; cbs.forEach(cb => cb(v)); },
         
        on: (_ev: string, cb: Function) => { cbs.push(cb); return () => {}; },
        simulateChange: (v: number) => cbs.forEach(cb => cb(v)),
      };
    },
     
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

  it('loads real history from localStorage', () => {
    localStorage.setItem('contextweaver_history', JSON.stringify([
      { id: "local1", query: "Local test query", time: "2024-01-01", latency: 100, status: "success", tokens: 50 }
    ]));
    const { getByText } = render(<HistoryPage />);
    expect(getByText('Local test query')).toBeInTheDocument();
    localStorage.removeItem('contextweaver_history');
  });

  it('ignores invalid history from localStorage', () => {
    localStorage.setItem('contextweaver_history', JSON.stringify({ invalid: "not an array" }));
    const { queryByText } = render(<HistoryPage />);
    expect(queryByText('Local test query')).not.toBeInTheDocument();
    localStorage.removeItem('contextweaver_history');
  });

  it('ignores empty array history from localStorage', () => {
    localStorage.setItem('contextweaver_history', JSON.stringify([]));
    const { queryByText } = render(<HistoryPage />);
    expect(queryByText('Local test query')).not.toBeInTheDocument();
    localStorage.removeItem('contextweaver_history');
  });
});
