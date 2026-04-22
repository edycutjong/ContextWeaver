import React from 'react';
import { render } from '@testing-library/react';
import AppLayout from '../layout';

// Mock the Sidebar to avoid dealing with next/navigation and lucide-react in this test
jest.mock('@/components/Sidebar', () => {
  return function MockSidebar() {
    return <div data-testid="sidebar">Sidebar Mock</div>;
  };
});

describe('AppLayout', () => {
  it('renders Sidebar and children', () => {
    const { getByTestId, getByText } = render(
      <AppLayout>
        <div data-testid="test-child">App Layout Child</div>
      </AppLayout>
    );

    expect(getByTestId('sidebar')).toBeInTheDocument();
    expect(getByTestId('test-child')).toBeInTheDocument();
    expect(getByText('App Layout Child')).toBeInTheDocument();
  });
});
