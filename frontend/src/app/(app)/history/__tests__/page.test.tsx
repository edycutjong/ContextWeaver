import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import HistoryPage from '../page';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: any, ref: any) => <div ref={ref} {...props}>{children}</div>),
    tr: React.forwardRef(({ children, ...props }: any, ref: any) => <tr ref={ref} {...props}>{children}</tr>),
  },
  useMotionValue: (init: any) => {
    let val = init;
    const cbs: any[] = [];
    return {
      get: () => val,
      set: (v: any) => { val = v; cbs.forEach(cb => cb(v)); },
      on: (ev: string, cb: any) => { cbs.push(cb); return () => {}; },
      simulateChange: (v: any) => cbs.forEach(cb => cb(v)),
    };
  },
  animate: (val: any, target: any) => {
    if (val.simulateChange) val.simulateChange(target);
    return { stop: jest.fn() };
  },
}));

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
