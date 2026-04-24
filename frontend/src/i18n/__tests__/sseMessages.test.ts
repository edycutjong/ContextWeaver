import { translateSseMessage } from '../sseMessages';

describe('translateSseMessage', () => {
  const mockT = jest.fn((key: string, vars?: Record<string, string | number>) => {
    if (vars) {
      return `${key}_${Object.values(vars).join('_')}`;
    }
    return key;
  });

  beforeEach(() => {
    mockT.mockClear();
  });

  it('should translate "Pipeline started"', () => {
    expect(translateSseMessage('Pipeline started', mockT)).toBe('started');
    expect(mockT).toHaveBeenCalledWith('started', undefined);
  });

  it('should translate "Chunking document"', () => {
    expect(translateSseMessage('Chunking document (size: 512, overlap: 20)...', mockT)).toBe('chunking_512_20');
    expect(mockT).toHaveBeenCalledWith('chunking', { size: '512', overlap: '20' });
  });

  it('should translate "Retrieving top examples"', () => {
    expect(translateSseMessage('Retrieving top 3 examples for chunk 1...', mockT)).toBe('retrieving_3_1');
    expect(mockT).toHaveBeenCalledWith('retrieving', { k: '3', i: '1' });
  });

  it('should translate "Building prompt"', () => {
    expect(translateSseMessage('Building prompt for chunk 2...', mockT)).toBe('buildingPrompt_2');
    expect(mockT).toHaveBeenCalledWith('buildingPrompt', { i: '2' });
  });

  it('should translate "Annotating chunk"', () => {
    expect(translateSseMessage('Annotating chunk 3...', mockT)).toBe('annotating_3');
    expect(mockT).toHaveBeenCalledWith('annotating', { i: '3' });
  });

  it('should translate "Merging chunk annotations"', () => {
    expect(translateSseMessage('Merging chunk annotations...', mockT)).toBe('merging');
    expect(mockT).toHaveBeenCalledWith('merging', undefined);
  });

  it('should return raw message if no rule matches', () => {
    const raw = 'Unknown message';
    expect(translateSseMessage(raw, mockT)).toBe(raw);
    expect(mockT).not.toHaveBeenCalled();
  });
});
