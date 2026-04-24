import { NextRequest } from 'next/server';

export const runtime = 'edge'; // Use Edge runtime for SSE streaming without buffering

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function GET(
  request: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  { params }: { params: Promise<{ id: string }> }
) {
  // We can read query parameters if needed
  // const searchParams = request.nextUrl.searchParams;
  
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        // Step 1: Init
        sendEvent({ step: 'init', message: 'Pipeline started' });
        await delay(500);

        // Step 2: Chunking
        sendEvent({ step: 'init', message: 'Chunking document (size: 1024, overlap: 50)...' });
        await delay(1000);

        const chunks = [
          "The ContextWeaver system is designed to provide high-fidelity retrieval augmented generation.",
          "It uses advanced chunking mechanisms to preserve semantic boundaries in long texts.",
          "The system relies on a vector database for efficient nearest-neighbor searches during retrieval."
        ];

        sendEvent({
          step: 'chunk_complete',
          chunks: chunks,
          message: 'Success ✅'
        });
        await delay(500);

        // Step 3: Retrieval and Annotation loop
        const finalEntities: any[] = [];
        let totalConfidence = 0;

        for (let i = 0; i < chunks.length; i++) {
          // Retrieving
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

          // Annotating
          sendEvent({ step: 'init', message: `Annotating chunk ${i + 1}/${chunks.length} with LLM...` });
          await delay(1200);

          let entity;
          if (i === 0) entity = { type: 'ORG', value: 'ContextWeaver' };
          else if (i === 1) entity = { type: 'CODE', value: 'chunking' };
          else entity = { type: 'SYSTEM', value: 'vector database' };

          const conf = 0.85 + (Math.random() * 0.1);
          finalEntities.push(entity);
          totalConfidence += conf;

          sendEvent({
            step: 'annotate_complete',
            chunk_idx: i,
            result: {
              entity: entity.value,
              confidence: conf,
              rationale: "Identified based on context."
            },
            message: `Success ✅`
          });
          await delay(500);
        }

        // Step 4: Done
        sendEvent({ step: 'init', message: 'Merging results and finalizing...' });
        await delay(1000);

        sendEvent({
          step: 'done',
          final_result: {
            mean_confidence: totalConfidence / chunks.length,
            merged_entities: finalEntities
          },
          message: 'Pipeline complete ✅'
        });

        controller.close();
      } catch (error) {
        console.error('SSE Error:', error);
        sendEvent({ step: 'error', message: 'Error ❌' });
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
