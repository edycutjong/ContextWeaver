/* eslint-disable */
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import LandingPage from '../page';

const mockSetX = jest.fn();
const mockSetY = jest.fn();

// Mock next/navigation so useRouter().prefetch() works in tests.
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    prefetch: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('@/components/LaunchTransition', () => ({
  launchToDashboard: jest.fn(),
}));

// Mock framer-motion to avoid animation issues
jest.mock('framer-motion', () => {
   
  const React = require('react');
  
  // Keep track of which useMotionValue call it is to return the right mock
  let motionValueCallCount = 0;
  
  const MockMotionDiv = React.forwardRef(({ children, style, className, onMouseMove, onMouseLeave }: React.HTMLAttributes<HTMLDivElement>, ref: React.Ref<HTMLDivElement>) => (
    <div ref={ref} style={style} className={className} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave} data-testid="motion-div">
      {children}
    </div>
  ));
  MockMotionDiv.displayName = 'MockMotionDiv';

  return {
    motion: {
      div: MockMotionDiv,
      h1: ({ children, className }: React.HTMLAttributes<HTMLHeadingElement>) => <h1 className={className}>{children}</h1>,
      p: ({ children, className }: React.HTMLAttributes<HTMLParagraphElement>) => <p className={className}>{children}</p>,
    },
    useMotionValue: () => {
      motionValueCallCount++;
      return { set: motionValueCallCount % 2 === 1 ? mockSetX : mockSetY };
    },
    useSpring: () => 0,
    useTransform: () => 0,
  };
});

describe('LandingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock getBoundingClientRect
    Element.prototype.getBoundingClientRect = jest.fn(() => {
        return {
            width: 100,
            height: 100,
            top: 0,
            left: 0,
            bottom: 100,
            right: 100,
            x: 0,
            y: 0,
            toJSON: () => {}
        };
    });
  });

  it('renders correctly', () => {
    const { getByText } = render(<LandingPage />);
    expect(getByText(/Dynamic In-Context/i)).toBeInTheDocument();
    expect(getByText(/Learning Router\./i)).toBeInTheDocument();
    expect(getByText('ContextWeaver')).toBeInTheDocument();
    expect(getByText('Launch Dashboard')).toBeInTheDocument();
  });

  it('handles mouse move on container', () => {
    const { container } = render(<LandingPage />);
    const mainDiv = container.firstChild as HTMLDivElement;
    
    // Initial style
    expect(mainDiv.style.getPropertyValue('--mouse-x')).toBe('50%');

    // Fire mouse move
    fireEvent.mouseMove(mainDiv, { clientX: 100, clientY: 200 });

    // After mouse move, the style should be updated
    expect(mainDiv.style.getPropertyValue('--mouse-x')).toBe('100px');
    expect(mainDiv.style.getPropertyValue('--mouse-y')).toBe('200px');
  });

  it('handles mouse move and leave on TiltCard', () => {
    const { getByText } = render(<LandingPage />);
    const cardContent = getByText('Sub-millisecond Routing');
    const tiltCardMotionDiv = cardContent.closest('[data-testid="motion-div"]') as HTMLDivElement;
    
    fireEvent.mouseMove(tiltCardMotionDiv, { clientX: 50, clientY: 50 });
    expect(mockSetX).toHaveBeenCalled();
    expect(mockSetY).toHaveBeenCalled();
    
    fireEvent.mouseLeave(tiltCardMotionDiv);
    expect(mockSetX).toHaveBeenCalledWith(0);
    expect(mockSetY).toHaveBeenCalledWith(0);
  });

  it('PipelinePreview cycles active index over time', () => {
    jest.useFakeTimers();
    render(<LandingPage />);
    // Initial state
    // Advance timer by 2 seconds
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    // Advance again to cover more states and branches
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    jest.useRealTimers();
  });

  it('Launch Dashboard link handles clicks and ignores modifier keys', () => {
    const { launchToDashboard } = require('@/components/LaunchTransition');
    const { getByText } = render(<LandingPage />);
    const link = getByText('Launch Dashboard');
    
    // Ignore with modifier keys
    fireEvent.click(link, { metaKey: true });
    fireEvent.click(link, { ctrlKey: true });
    fireEvent.click(link, { shiftKey: true });
    fireEvent.click(link, { altKey: true });
    fireEvent.click(link, { button: 1 }); // Middle click
    expect(launchToDashboard).not.toHaveBeenCalled();

    // Normal click
    fireEvent.click(link, { clientX: 100, clientY: 100, button: 0 });
    expect(launchToDashboard).toHaveBeenCalledWith(expect.objectContaining({ href: '/dashboard', originX: 100, originY: 100 }));
    
    // Click without clientX/clientY (fallback to rect center)
    launchToDashboard.mockClear();
    fireEvent.click(link, { button: 0 });
    // Based on our mock getBoundingClientRect (100x100 at 0,0), center is 50,50
    expect(launchToDashboard).toHaveBeenCalledWith(expect.objectContaining({ originX: 50, originY: 50 }));
  });
});
