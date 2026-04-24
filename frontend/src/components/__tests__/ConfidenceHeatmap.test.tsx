import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfidenceHeatmap from '../ConfidenceHeatmap';

describe('ConfidenceHeatmap', () => {
  it('returns null if chunks is falsy or empty', () => {
    // @ts-expect-error Testing invalid input
    const { container: containerNull } = render(<ConfidenceHeatmap chunks={null} onSelectChunk={jest.fn()} />);
    expect(containerNull.firstChild).toBeNull();

    const { container: containerEmpty } = render(<ConfidenceHeatmap chunks={[]} onSelectChunk={jest.fn()} />);
    expect(containerEmpty.firstChild).toBeNull();
  });

  it('renders chunks with correct colors based on confidence', () => {
    const chunks = [
      { id: 1, confidence: 0.95 },
      { id: 2, result: { confidence: 0.85 } },
      { id: 3, confidence: 0.75 },
      { id: 4, confidence: 0.5 },
      { id: 5 }, // No confidence
    ];

    render(<ConfidenceHeatmap chunks={chunks} onSelectChunk={jest.fn()} />);
    
    expect(screen.getByText('🔥')).toBeInTheDocument();
    
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);
    
    // Check colors
    expect(buttons[0].firstChild).toHaveClass('bg-green-500'); // 0.95
    expect(buttons[1].firstChild).toHaveClass('bg-green-400'); // 0.85
    expect(buttons[2].firstChild).toHaveClass('bg-amber-400'); // 0.75
    expect(buttons[3].firstChild).toHaveClass('bg-red-500');   // 0.50
    expect(buttons[4].firstChild).toHaveClass('bg-slate-800'); // 0
  });

  it('calls onSelectChunk when a chunk is clicked', () => {
    const onSelectChunk = jest.fn();
    const chunks = [{ id: 1, confidence: 0.9 }];
    
    render(<ConfidenceHeatmap chunks={chunks} onSelectChunk={onSelectChunk} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(onSelectChunk).toHaveBeenCalledWith(chunks[0]);
  });
});
