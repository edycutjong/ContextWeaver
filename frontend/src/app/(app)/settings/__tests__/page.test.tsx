import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import SettingsPage from '../page';

// Mock framer-motion
jest.mock('framer-motion', () => {
  const mockComponent = (tag: string) => {
    const MockComp = React.forwardRef((allProps: React.HTMLAttributes<HTMLElement> & { [key: string]: unknown }, ref: React.Ref<HTMLElement>) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { whileHover, whileTap, layoutId, initial, animate, exit, transition, ...props } = allProps;
      const Tag = tag as React.ElementType;
      return <Tag ref={ref} {...props}>{allProps.children}</Tag>;
    });
    MockComp.displayName = `MockMotion(${tag})`;
    return MockComp;
  };
  return {
    motion: {
      div: mockComponent('div'),
      section: mockComponent('section'),
      button: mockComponent('button'),
      span: mockComponent('span'),
    },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

describe('SettingsPage', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders correctly', () => {
    const { getByText } = render(<SettingsPage />);
    expect(getByText('Router Settings')).toBeInTheDocument();
    expect(getByText('Retrieval Engine (ChromaDB)')).toBeInTheDocument();
  });

  it('updates slider values', () => {
    const { container } = render(<SettingsPage />);
    const inputs = container.querySelectorAll('input[type="range"]');
    
    // Change chunk size
    fireEvent.change(inputs[0], { target: { value: '512' } });
    
    // Change chunk overlap
    fireEvent.change(inputs[1], { target: { value: '256' } });
  });

  it('updates top-K value', () => {
    const { getByText } = render(<SettingsPage />);
    
    // Should be able to click on "10 Chunks"
    fireEvent.click(getByText('10 Chunks'));
    
    // Re-clicking another
    fireEvent.click(getByText('3 Chunks'));
  });

  it('handles save configuration and shows toast', () => {
    const { getByText, queryByText } = render(<SettingsPage />);
    
    const saveBtn = getByText('Save Configuration');
    
    // Toast should not be visible
    expect(queryByText('Saved successfully')).not.toBeInTheDocument();
    
    // Click save
    fireEvent.click(saveBtn);
    
    // Toast should appear
    expect(getByText('Saved successfully')).toBeInTheDocument();
    
    // Fast forward time to hide toast
    act(() => {
      jest.advanceTimersByTime(2500);
    });
    
    // Toast should disappear
    expect(queryByText('Saved successfully')).not.toBeInTheDocument();
  });
});
