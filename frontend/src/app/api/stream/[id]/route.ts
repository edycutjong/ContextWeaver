import { NextRequest } from 'next/server';

export const runtime = 'edge';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function mockStream(controller: ReadableStreamDefaultController, encoder: TextEncoder) {
  const sendEvent = (data: unknown) => {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  };

  sendEvent({ step: 'init', message: 'Pipeline started' });
  await delay(500);

  sendEvent({ step: 'init', message: 'Chunking document (size: 1024, overlap: 50)...' });
  await delay(1000);

  const chunks = [
    "The ContextWeaver system is designed to provide high-fidelity retrieval augmented generation.",
    "It uses advanced chunking mechanisms to preserve semantic boundaries in long texts.",
    "The system relies on a vector database for efficient nearest-neighbor searches during retrieval."
  ];

  sendEvent({ step: 'chunk_complete', chunks, message: 'Success ✅' });
  await delay(500);

  const finalEntities: unknown[] = [];
  let totalConfidence = 0;

  for (let i = 0; i < chunks.length; i++) {
    sendEvent({ step: 'init', message: `Retrieving context for chunk ${i + 1}/${chunks.length}...` });
    await delay(800);

    sendEvent({
      step: 'retrieve_complete',
      chunk_idx: i,
      examples: [
        { text: "Prior systems used simple keyword matching.", source: "doc1.txt" },
        { text: "Modern systems employ dense vector embeddings.", source: "doc2.txt" }
      ],
      message: `Retrieved 2 examples for chunk ${i + 1}`
    });
    await delay(500);

    sendEvent({ step: 'init', message: `Annotating chunk ${i + 1}/${chunks.length} with LLM...` });
    await delay(1200);

    let entity: { type: string; value: string };
    if (i === 0) entity = { type: 'ORG', value: 'ContextWeaver' };
    else if (i === 1) entity = { type: 'CODE', value: 'chunking' };
    else entity = { type: 'SYSTEM', value: 'vector database' };

    const conf = 0.85 + (Math.random() * 0.1);
    finalEntities.push(entity);
    totalConfidence += conf;

    sendEvent({
      step: 'annotate_complete',
      chunk_idx: i,
      result: { entity: entity.value, confidence: conf, rationale: "Identified based on context." },
      message: `Success ✅`
    });
    await delay(500);
  }

  sendEvent({ step: 'init', message: 'Merging results and finalizing...' });
  await delay(1000);

  sendEvent({
    step: 'done',
    final_result: { mean_confidence: totalConfidence / chunks.length, merged_entities: finalEntities },
    message: 'Pipeline complete ✅'
  });

  controller.close();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const useMock = process.env.USE_MOCK === 'true';

  if (!useMock) {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
    const queryParams = request.nextUrl.search;
    const fullUrl = `${backendUrl}/api/stream/${id}${queryParams}`;
    
    console.log(`[Proxy] Fetching from backend: ${fullUrl}`);

    try {
      const upstream = await fetch(fullUrl, {
        headers: { Accept: 'text/event-stream' },
        // Set a reasonable timeout or check for abort signal
        signal: request.signal,
      });

      if (!upstream.ok) {
        const errorText = await upstream.text().catch(() => 'No error body');
        console.error(`[Proxy] Backend returned error ${upstream.status}: ${errorText}`);
        return new Response(`data: ${JSON.stringify({ step: 'error', message: `Backend error ${upstream.status}` })}\n\n`, {
          status: upstream.status,
          headers: { 'Content-Type': 'text/event-stream' },
        });
      }

      return new Response(upstream.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
          'Content-Encoding': 'none',
        },
      });
    } catch (error) {
      console.error(`[Proxy] Fetch failed for ${fullUrl}:`, error);
      return new Response(`data: ${JSON.stringify({ step: 'error', message: 'Connection to backend failed' })}\n\n`, {
        status: 502,
        headers: { 'Content-Type': 'text/event-stream' },
      });
    }
  }

  // USE_MOCK=true — no backend required
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        await mockStream(controller, encoder);
      } catch (error) {
        console.error('SSE Error:', error);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ step: 'error', message: 'Error ❌' })}\n\n`));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Content-Encoding': 'none',
    },
  });
}
