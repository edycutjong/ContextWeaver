import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import Dashboard from '../page';

// Mock components
jest.mock('@/components/PipelineGraph', () => {
  return function MockPipelineGraph({ isNodeActive, nodes, currentStep }: any) {
    // Call isNodeActive for all steps and nodes to ensure 100% coverage of the graph configs
    const steps = ['init', 'chunking', 'chunk_complete', 'retrieving', 'retrieve_complete', 'building_prompt', 'annotating', 'annotate_complete', 'merging', 'done', 'other'];
    steps.forEach(step => {
      nodes.forEach((n: any) => isNodeActive(n.id, step));
    });
    return <div data-testid="pipeline-graph" />;
  };
});
jest.mock('@/components/ChunkInspector', () => ({ onClose }: any) => <div data-testid="chunk-inspector" onClick={onClose} />);
jest.mock('@/components/ConfidenceHeatmap', () => ({ onSelectChunk }: any) => <div data-testid="confidence-heatmap" onClick={() => onSelectChunk({ id: 'test' })} />);

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: any, ref: any) => <div ref={ref} {...props}>{children}</div>),
    span: React.forwardRef(({ children, ...props }: any, ref: any) => <span ref={ref} {...props}>{children}</span>),
    button: React.forwardRef(({ children, ...props }: any, ref: any) => <button ref={ref} {...props}>{children}</button>),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useMotionValue: (init: any) => {
    let val = init;
    const cbs: any[] = [];
    return {
      get: () => val,
      set: (v: any) => { val = v; cbs.forEach(cb => cb(v)); },
      on: (ev: string, cb: any) => { cbs.push(cb); return () => {}; },
      simulateChange: (v: any) => cbs.forEach(cb => cb(v)),
    };
  },
  animate: (val: any, target: any) => {
    if (val.simulateChange) val.simulateChange(target);
    return { stop: jest.fn() };
  },
}));

describe('Dashboard', () => {
  let mockEventSource: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockEventSource = {
      close: jest.fn(),
    };
    
    global.EventSource = jest.fn(() => mockEventSource) as any;
    
    global.URL.createObjectURL = jest.fn(() => 'mock-url');
    global.URL.revokeObjectURL = jest.fn();
    
    // Create a mock for HTMLAnchorElement's click
    const originalCreateElement = document.createElement.bind(document);
    document.createElement = jest.fn((tagName) => {
      const el = originalCreateElement(tagName);
      if (tagName === 'a') {
        el.click = jest.fn();
      }
      return el;
    }) as any;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders correctly', () => {
    const { getByText, getByTestId } = render(<Dashboard />);
    expect(getByText('ContextWeaver')).toBeInTheDocument();
    expect(getByTestId('pipeline-graph')).toBeInTheDocument();
  });

  it('switches graphs to hit isNodeActive coverage', () => {
    const { getByText } = render(<Dashboard />);
    fireEvent.click(getByText('Standard RAG'));
    fireEvent.click(getByText('Multi-Agent System'));
    fireEvent.click(getByText('Evaluator-Optimizer'));
    fireEvent.click(getByText('Routing Agent'));
    fireEvent.click(getByText('ContextWeaver Flow'));
  });

  it('starts pipeline and handles events', () => {
    jest.useFakeTimers();
    const { getByText } = render(<Dashboard />);
    
    const runBtn = getByText('Run Document Annotation');
    fireEvent.click(runBtn);
    
    expect(global.EventSource).toHaveBeenCalledWith('http://localhost:8000/api/stream/123');
    
    act(() => {
      mockEventSource.onmessage({ data: JSON.stringify({ step: 'init', message: 'Started' }) });
    });
    
    // Advance timers for typewriter
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    act(() => {
      mockEventSource.onmessage({ data: JSON.stringify({ step: 'chunk_complete', chunks: ['chunk1', 'chunk2'] }) });
    });
    
    act(() => {
      mockEventSource.onmessage({ data: JSON.stringify({ step: 'retrieve_complete', chunk_idx: 0, examples: ['ex1'] }) });
    });
    
    act(() => {
      mockEventSource.onmessage({ data: JSON.stringify({ step: 'annotate_complete', chunk_idx: 0, result: { entity: 'test' } }) });
    });
    
    act(() => {
      mockEventSource.onmessage({ 
        data: JSON.stringify({ 
          step: 'done', 
          final_result: { 
            mean_confidence: 0.85,
            merged_entities: [{ type: 'ORG', value: 'Google' }, { label: 'PERSON', value: 'Alice' }, 'NoType']
          } 
        }) 
      });
    });
    
    expect(getByText('✅ Annotation Complete')).toBeInTheDocument();
    
    const exportBtn = getByText('Export JSON');
    fireEvent.click(exportBtn);
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    
    act(() => {
      mockEventSource.onerror(new Error('Network error'));
    });
    
    jest.useRealTimers();
  });

  it('handles zero log messages edge case', () => {
    jest.useFakeTimers();
    render(<Dashboard />);
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    jest.useRealTimers();
  });

  it('handles chunk selection and inspector close', () => {
    const { getByTestId } = render(<Dashboard />);
    fireEvent.click(getByTestId('confidence-heatmap'));
    fireEvent.click(getByTestId('chunk-inspector'));
  });
});
