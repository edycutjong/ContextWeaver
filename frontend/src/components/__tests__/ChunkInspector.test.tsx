import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ChunkInspector from '../ChunkInspector';

describe('ChunkInspector', () => {
  const mockChunkData = {
    chunk_idx: 1,
    confidence: 0.9,
    raw_text: 'This is raw text.',
    examples: [
      { text: 'Content 1', annotation: 'Annot 1', similarity_score: 0.95 },
      { text: 'Content 2', annotation: 'Annot 2', similarity_score: 0.85 },
    ],
    prompt: 'Please extract...',
    annotation: '{"entities": []}'
  };

  const mockOnClose = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
    document.body.style.overflow = '';
  });

  it('does not render when chunkData is null', () => {
    render(<ChunkInspector chunkData={null} onClose={mockOnClose} />);
    expect(screen.queryByText('Chunk Inspector')).not.toBeInTheDocument();
  });

  it('renders correctly when chunkData is provided and modifies body overflow', () => {
    render(<ChunkInspector chunkData={mockChunkData} onClose={mockOnClose} />);
    
    // Portal renders to body
    expect(screen.getByText('Chunk Inspector')).toBeInTheDocument();
    expect(document.body.style.overflow).toBe('hidden');

    expect(screen.getByText('This is raw text.')).toBeInTheDocument();
    expect(screen.getByText('Content 1')).toBeInTheDocument();
    expect(screen.getByText('Content 2')).toBeInTheDocument();
    expect(screen.getByText('Please extract...')).toBeInTheDocument();
    expect(screen.getByText('{"entities": []}')).toBeInTheDocument();
    
    // Confidence ring renders 90%
    expect(screen.getByText('90%')).toBeInTheDocument();
    
    // Similarity score
    expect(screen.getByText('95.0%')).toBeInTheDocument();
    expect(screen.getByText('85.0%')).toBeInTheDocument();
  });

  it('calls onClose when close button or overlay is clicked', () => {
    render(<ChunkInspector chunkData={mockChunkData} onClose={mockOnClose} />);
    
    const closeButton = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    
    const overlay = document.querySelector('.fixed.inset-0') as HTMLElement;
    if (overlay) fireEvent.click(overlay);
    expect(mockOnClose).toHaveBeenCalledTimes(2);
  });

  it('renders correct confidence color when confidence is medium (0.7)', () => {
    render(<ChunkInspector chunkData={{ ...mockChunkData, confidence: 0.7 }} onClose={mockOnClose} />);
    expect(screen.getByText('70%')).toBeInTheDocument();
  });

  it('renders correct confidence color when confidence is low (0.5)', () => {
    render(<ChunkInspector chunkData={{ ...mockChunkData, confidence: 0.5 }} onClose={mockOnClose} />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('does not render ConfidenceRing when confidence is missing', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confidence, ...dataWithoutConfidence } = mockChunkData;
    
    render(<ChunkInspector chunkData={dataWithoutConfidence} onClose={mockOnClose} />);
    expect(screen.queryByText('90%')).not.toBeInTheDocument();
  });

  it('stops propagation when clicking the modal content', () => {
    render(<ChunkInspector chunkData={mockChunkData} onClose={mockOnClose} />);
    const modalContent = screen.getByText('Chunk Inspector').parentElement?.parentElement as HTMLElement;
    fireEvent.click(modalContent);
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('handles missing examples array gracefully', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { examples, ...dataWithoutExamples } = mockChunkData;
    
    render(<ChunkInspector chunkData={dataWithoutExamples} onClose={mockOnClose} />);
    expect(screen.getByText('Chunk Inspector')).toBeInTheDocument();
    expect(screen.queryByText('Example 1')).not.toBeInTheDocument();
  });
  
  it('handles missing similarity_score in examples', () => {
    const dataWithMissingScore = { 
      ...mockChunkData, 
      examples: [{ text: 'Example 3', annotation: 'Annot 3' }] 
    };
    render(<ChunkInspector chunkData={dataWithMissingScore} onClose={mockOnClose} />);
    expect(screen.getByText('0.0%')).toBeInTheDocument();
  });

  it('resets overflow on unmount', () => {
    const { unmount } = render(<ChunkInspector chunkData={mockChunkData} onClose={mockOnClose} />);
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('handles keyboard navigation when onPrevious and onNext are provided', () => {
    const mockPrevious = jest.fn();
    const mockNext = jest.fn();
    
    render(<ChunkInspector chunkData={mockChunkData} onClose={mockOnClose} onPrevious={mockPrevious} onNext={mockNext} />);
    
    // Test ArrowLeft
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(mockPrevious).toHaveBeenCalledTimes(1);
    
    // Test ArrowRight
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(mockNext).toHaveBeenCalledTimes(1);
    
    // Test Escape
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    
    // Test arbitrary key
    fireEvent.keyDown(window, { key: 'Enter' });
    // No additional calls
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('handles next and previous button clicks', () => {
    const mockPrevious = jest.fn();
    const mockNext = jest.fn();
    
    render(<ChunkInspector chunkData={mockChunkData} onClose={mockOnClose} onPrevious={mockPrevious} onNext={mockNext} />);
    
    const prevButton = screen.getByLabelText('Previous Chunk');
    fireEvent.click(prevButton);
    expect(mockPrevious).toHaveBeenCalledTimes(1);
    
    const nextButton = screen.getByLabelText('Next Chunk');
    fireEvent.click(nextButton);
    expect(mockNext).toHaveBeenCalledTimes(1);
  });

  it('handles missing raw_text', () => {
    const { raw_text, ...dataWithoutText } = mockChunkData;
    render(<ChunkInspector chunkData={dataWithoutText} onClose={mockOnClose} />);
    expect(screen.getByText('This is a very long legal document')).toBeInTheDocument();
  });
});
