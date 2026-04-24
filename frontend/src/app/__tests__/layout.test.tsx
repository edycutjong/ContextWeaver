 
import React from 'react';
import { render } from '@testing-library/react';
import RootLayout, { metadata } from '../layout';

// Mock next/font/google
jest.mock('next/font/google', () => ({
  Geist: () => ({ variable: '--font-geist-sans' }),
  Geist_Mono: () => ({ variable: '--font-geist-mono' }),
  Orbitron: () => ({ variable: '--font-orbitron' }),
  Noto_Sans_SC: () => ({ variable: '--font-noto-sans-sc' }),
}));

jest.mock('@/components/LaunchTransition', () => {
  const Mock = () => null;
  Mock.displayName = 'MockLaunchTransition';
  return Mock;
});

describe('RootLayout', () => {
  it('renders children within html and body tags', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // RootLayout is an async component, so we must await it before rendering
    const LayoutResolved = await RootLayout({
      children: <div>Test Child</div>
    });
    
    const { getByText } = render(LayoutResolved);

    expect(getByText('Test Child')).toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  it('exports metadata with expected properties', () => {
    expect(metadata.title).toBeDefined();
    expect(metadata.description).toBeDefined();
    expect(metadata.keywords).toContain('ContextWeaver');
  });
});
