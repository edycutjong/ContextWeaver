import React from 'react';
import { render } from '@testing-library/react';
import AppLayout from '../layout';

jest.mock('@/components/Header', () => {
  return function MockHeader() {
    return <div data-testid="header">Header Mock</div>;
  };
});

describe('AppLayout', () => {
  it('renders Header and children', () => {
    const { getByTestId, getByText } = render(
      <AppLayout>
        <div data-testid="test-child">App Layout Child</div>
      </AppLayout>
    );

    expect(getByTestId('header')).toBeInTheDocument();
    expect(getByTestId('test-child')).toBeInTheDocument();
    expect(getByText('App Layout Child')).toBeInTheDocument();
  });
});
