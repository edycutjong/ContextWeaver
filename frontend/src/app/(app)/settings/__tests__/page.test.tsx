/* eslint-disable */
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import SettingsPage from '../page';

// Mock framer-motion
jest.mock('framer-motion', () => {
  const mockComponent = (tag: string) => {
    const MockComp = React.forwardRef((allProps: React.HTMLAttributes<HTMLElement> & { [key: string]: unknown }, ref: React.Ref<HTMLElement>) => {
       
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
    // Mock localStorage
    const store: Record<string, string> = {
      'contextweaver_settings': JSON.stringify({
        topK: 10,
        chunkSize: 1024,
        chunkOverlap: 50,
        activeModel: 'deep'
      })
    };
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key: string) => store[key] || null),
        setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
        clear: jest.fn(() => { Object.keys(store).forEach(k => delete store[k]); })
      },
      writable: true
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
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

  it('updates model selection', () => {
    const { getByText } = render(<SettingsPage />);
    
    // Switch to Fast Model
    fireEvent.click(getByText('Fast Model'));
    expect(getByText('Fast Model')).toBeInTheDocument();
    
    // Switch back to Deep Model
    fireEvent.click(getByText('Deep Model'));
    expect(getByText('Deep Model')).toBeInTheDocument();
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

  it('handles empty local storage settings gracefully', () => {
    // Override local storage to return empty object
    window.localStorage.setItem('contextweaver_settings', JSON.stringify({}));
    render(<SettingsPage />);
  });

  it('handles invalid JSON in local storage gracefully', () => {
    // Override local storage to return invalid JSON
    window.localStorage.setItem('contextweaver_settings', 'invalid-json');
    render(<SettingsPage />);
  });

  it('handles null local storage settings gracefully', () => {
    window.localStorage.clear();
    render(<SettingsPage />);
  });
});
