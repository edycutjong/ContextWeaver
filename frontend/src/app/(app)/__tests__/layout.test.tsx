 
import React from 'react';
import { render } from '@testing-library/react';
import AppLayout from '../layout';

jest.mock('@/components/Header', () => {
  return function MockHeader() {
    return <div data-testid="header">Header Mock</div>;
  };
});

jest.mock('@/components/StarField', () => {
  const Mock = () => <div data-testid="starfield" />;
  Mock.displayName = 'MockStarField';
  return Mock;
});

jest.mock('@/components/CommandPalette', () => {
  const Mock = () => <div data-testid="command-palette" />;
  Mock.displayName = 'MockCommandPalette';
  return Mock;
});

jest.mock('@/components/ToastLayer', () => {
  const Mock = () => <div data-testid="toast-layer" />;
  Mock.displayName = 'MockToastLayer';
  return Mock;
});

jest.mock('@/components/ShortcutsOverlay', () => {
  const Mock = () => <div data-testid="shortcuts-overlay" />;
  Mock.displayName = 'MockShortcutsOverlay';
  return Mock;
});

jest.mock('@/components/KeyboardShortcuts', () => {
  const Mock = () => null;
  Mock.displayName = 'MockKeyboardShortcuts';
  return Mock;
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
