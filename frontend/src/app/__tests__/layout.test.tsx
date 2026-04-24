import React from 'react';
import { render } from '@testing-library/react';
import RootLayout, { metadata } from '../layout';

// Mock next/font/google
jest.mock('next/font/google', () => ({
  Geist: () => ({ variable: '--font-geist-sans' }),
  Geist_Mono: () => ({ variable: '--font-geist-mono' }),
  Orbitron: () => ({ variable: '--font-orbitron' }),
}));

jest.mock('@/components/LaunchTransition', () => {
  const Mock = () => null;
  Mock.displayName = 'MockLaunchTransition';
  return Mock;
});

describe('RootLayout', () => {
  it('renders children within html and body tags', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const { getByText } = render(
      <RootLayout>
        <div>Test Child</div>
      </RootLayout>
    );

    expect(getByText('Test Child')).toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  it('exports metadata with expected properties', () => {
    expect(metadata.title).toBeDefined();
    expect(metadata.description).toBeDefined();
    expect(metadata.keywords).toContain('ContextWeaver');
  });
});
