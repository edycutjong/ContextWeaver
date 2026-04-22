import asyncio
import json
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from core.chunker import chunk_document
from core.retriever import Retriever
from core.annotator import Annotator
from core.merger import merge_annotations

router = APIRouter()
retriever = Retriever()
annotator = Annotator()

# Add some dummy historical examples for the retriever
dummy_examples = [
    {"text": "The company Apple Inc. reported Q3 earnings.", "annotation": "{\"entities\": [{\"type\": \"ORG\", \"value\": \"Apple Inc.\"}]}"},
    {"text": "John Doe signed the contract on Tuesday.", "annotation": "{\"entities\": [{\"type\": \"PERSON\", \"value\": \"John Doe\"}]}"},
    {"text": "The Supreme Court ruled in favor of the plaintiff.", "annotation": "{\"entities\": [{\"type\": \"ORG\", \"value\": \"Supreme Court\"}]}"},
    {"text": "Microsoft acquired GitHub for $7.5 billion.", "annotation": "{\"entities\": [{\"type\": \"ORG\", \"value\": \"Microsoft\"}, {\"type\": \"ORG\", \"value\": \"GitHub\"}]}"},
]
retriever.add_examples(dummy_examples)

class DocumentRequest(BaseModel):
    text: str

@router.post("/api/annotate")
async def start_annotation(req: DocumentRequest):
    """
    Start the annotation pipeline and return a job_id. 
    (For simplicity in this hackathon version, we stream directly from a GET endpoint)
    """
    return {"job_id": "job_123", "status": "started"}

@router.get("/api/stream/{job_id}")
async def stream_annotation(job_id: str, text: str = "Default document text for testing purposes. It should be long enough to chunk."):
    """
    Stream Server-Sent Events (SSE) detailing the pipeline progress.
    In a real app, `text` would be fetched via `job_id`. We pass it in query for demo simplicity if needed,
    or just use a massive dummy text if none provided.
    """
    # Create a long text if default is passed to simulate chunking
    if text.startswith("Default"):
        text = "This is a very long legal document. " * 50
        
    async def event_generator():
        yield f"data: {json.dumps({'step': 'init', 'message': 'Pipeline started'})}\n\n"
        await asyncio.sleep(0.5)
        
        # 1. Chunking
        yield f"data: {json.dumps({'step': 'chunking', 'message': 'Chunking document...'})}\n\n"
        chunks = chunk_document(text, chunk_size=200, chunk_overlap=20)
        yield f"data: {json.dumps({'step': 'chunk_complete', 'chunks': chunks})}\n\n"
        await asyncio.sleep(0.5)
        
        all_annotations = []
        
        # Process each chunk
        for i, chunk in enumerate(chunks):
            # 2. Retrieve
            yield f"data: {json.dumps({'step': 'retrieving', 'chunk_idx': i, 'message': f'Retrieving examples for chunk {i}...'})}\n\n"
            examples = retriever.get_top_k(chunk, k=3)
            yield f"data: {json.dumps({'step': 'retrieve_complete', 'chunk_idx': i, 'examples': examples})}\n\n"
            
            # 3. Compose Prompt
            yield f"data: {json.dumps({'step': 'building_prompt', 'chunk_idx': i, 'message': f'Building prompt for chunk {i}...'})}\n\n"
            prompt = annotator.build_prompt(chunk, examples)
            await asyncio.sleep(0.3)
            
            # 4. Annotate
            yield f"data: {json.dumps({'step': 'annotating', 'chunk_idx': i, 'message': f'Annotating chunk {i}...'})}\n\n"
            result = await annotator.annotate(prompt, chunk)
            result['chunk_idx'] = i
            result['raw_text'] = chunk
            all_annotations.append(result)
            
            yield f"data: {json.dumps({'step': 'annotate_complete', 'chunk_idx': i, 'result': result})}\n\n"
            
        # 5. Merge
        yield f"data: {json.dumps({'step': 'merging', 'message': 'Merging chunk annotations...'})}\n\n"
        final_result = merge_annotations(all_annotations)
        await asyncio.sleep(0.5)
        
        yield f"data: {json.dumps({'step': 'done', 'final_result': final_result})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
