 
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Header from '../Header';
import { usePathname } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

// Mock CommandPaletteHint to avoid complexity
jest.mock('@/components/CommandPalette', () => ({
  CommandPaletteHint: () => <div data-testid="command-palette-hint" />,
}));

describe('Header Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly on home page', () => {
    (usePathname as jest.Mock).mockReturnValue('/');
    render(<Header />);
    
    // Logo should be present
    expect(screen.getByText('ContextWeaver')).toBeInTheDocument();
    
    // Nav pill container should NOT be present on '/'
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    
    // Command palette hint should NOT be present on '/'
    expect(screen.queryByTestId('command-palette-hint')).not.toBeInTheDocument();
    
    // Source link should be present
    expect(screen.getByText('Source')).toBeInTheDocument();
  });

  it('renders correctly on dashboard and shows nav items', () => {
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
    render(<Header />);
    
    // Nav items should be visible
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    
    // Active dot should be on Dashboard
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveClass('nav-pill-active');
    
    // Command palette hint should be visible
    expect(screen.getByTestId('command-palette-hint')).toBeInTheDocument();
  });

  it('handles scroll events to update styling', () => {
    (usePathname as jest.Mock).mockReturnValue('/');
    render(<Header />);
    
    const headerElement = screen.getByRole('banner');
    expect(headerElement).toHaveClass('header-top');
    
    // Simulate scroll down
    fireEvent.scroll(window, { target: { scrollY: 50 } });
    expect(headerElement).toHaveClass('header-scrolled');
    
    // Simulate scroll up
    fireEvent.scroll(window, { target: { scrollY: 10 } });
    expect(headerElement).toHaveClass('header-top');
  });
});
