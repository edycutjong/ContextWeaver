/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET, runtime } from '../route';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Route - /api/stream/[id]', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let consoleLogMock: jest.SpyInstance;
  let consoleErrorMock: jest.SpyInstance;

  beforeEach(() => {
    originalEnv = { ...process.env };
    consoleLogMock = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
    consoleLogMock.mockRestore();
    consoleErrorMock.mockRestore();
  });

  const createMockRequest = (url: string = 'http://localhost:3000/api/stream/123') => {
    return new NextRequest(url);
  };

  it('should export runtime as edge', () => {
    expect(runtime).toBe('edge');
  });

  describe('USE_MOCK = false (Proxy Mode)', () => {
    beforeEach(() => {
      process.env.USE_MOCK = 'false';
      process.env.BACKEND_URL = 'http://test-backend:8000';
    });

    it('should successfully proxy the request to the backend', async () => {
      const mockStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('data: {"step":"init"}\n\n'));
          controller.close();
        }
      });
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        body: mockStream,
      });

      const request = createMockRequest('http://localhost:3000/api/stream/123?q=test');
      const response = await GET(request, { params: Promise.resolve({ id: '123' }) });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://test-backend:8000/api/stream/123?q=test',
        expect.objectContaining({
          headers: { Accept: 'text/event-stream' },
        })
      );
      
      expect(response.headers.get('Content-Type')).toBe('text/event-stream');
      expect(response.body).toBe(mockStream);
    });

    it('should use default backend url if BACKEND_URL is not set', async () => {
      delete process.env.BACKEND_URL;
      
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        body: new ReadableStream(),
      });

      const request = createMockRequest('http://localhost:3000/api/stream/123');
      await GET(request, { params: Promise.resolve({ id: '123' }) });

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/stream/123',
        expect.any(Object)
      );
    });

    it('should return error response if upstream is not ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        text: jest.fn().mockResolvedValue('Not found'),
      });

      const request = createMockRequest();
      const response = await GET(request, { params: Promise.resolve({ id: '123' }) });

      expect(response.status).toBe(404);
      expect(response.headers.get('Content-Type')).toBe('text/event-stream');
      const reader = response.body?.getReader();
      const { value } = await reader!.read();
      const text = new TextDecoder().decode(value);
      expect(text).toContain('Backend error 404');
    });

    it('should handle fetch errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network Error'));

      const request = createMockRequest();
      const response = await GET(request, { params: Promise.resolve({ id: '123' }) });

      expect(response.status).toBe(502);
      expect(response.headers.get('Content-Type')).toBe('text/event-stream');
      const reader = response.body?.getReader();
      const { value } = await reader!.read();
      const text = new TextDecoder().decode(value);
      expect(text).toContain('Connection to backend failed');
    });

    it('should handle missing error body when upstream is not ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        text: jest.fn().mockRejectedValue(new Error('Cannot read body')),
      });

      const request = createMockRequest();
      const response = await GET(request, { params: Promise.resolve({ id: '123' }) });

      expect(response.status).toBe(500);
      const reader = response.body?.getReader();
      const { value } = await reader!.read();
      const text = new TextDecoder().decode(value);
      expect(text).toContain('Backend error 500');
    });
  });

  describe('USE_MOCK = true (Mock Mode)', () => {
    beforeEach(() => {
      process.env.USE_MOCK = 'true';
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return a mocked event stream', async () => {
      const request = createMockRequest();
      const response = await GET(request, { params: Promise.resolve({ id: '123' }) });

      expect(response.headers.get('Content-Type')).toBe('text/event-stream');
      
      const reader = response.body?.getReader();
      expect(reader).toBeDefined();

      if (!reader) return;

      const chunks: string[] = [];
      
      const readStream = async () => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(new TextDecoder().decode(value));
        }
      };

      const readPromise = readStream();
      
      await jest.advanceTimersByTimeAsync(20000);
      
      await readPromise;
      
      const fullOutput = chunks.join('');
      expect(fullOutput).toContain('Pipeline started');
      expect(fullOutput).toContain('Chunking document');
      expect(fullOutput).toContain('Pipeline complete');
    });

    it('should handle mock stream errors', async () => {
      // Induce an error in mockStream by mocking Math.random to throw
      const mathRandomSpy = jest.spyOn(Math, 'random').mockImplementation(() => {
        throw new Error('Induced error for testing');
      });

      const request = createMockRequest();
      const response = await GET(request, { params: Promise.resolve({ id: '123' }) });
      
      const reader = response.body?.getReader();
      expect(reader).toBeDefined();

      const chunks: string[] = [];
      
      const readStream = async () => {
        while (true) {
          const { done, value } = await reader!.read();
          if (done) break;
          chunks.push(new TextDecoder().decode(value));
        }
      };

      const readPromise = readStream();
      
      await jest.advanceTimersByTimeAsync(10000);
      
      await readPromise;
      
      const fullOutput = chunks.join('');
      expect(fullOutput).toContain('Error ❌');
      
      mathRandomSpy.mockRestore();
    });
  });
});
