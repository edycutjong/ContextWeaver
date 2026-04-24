import React from 'react';
import { render, fireEvent } from '@testing-library/react';
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

// Mock framer-motion to avoid animation issues
jest.mock('framer-motion', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
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
});
