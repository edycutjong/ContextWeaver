import asyncio
import json
import uuid
from pathlib import Path
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from core.chunker import chunk_document
from core.retriever import Retriever
from core.annotator import Annotator
from core.merger import merge_annotations
from core.exporter import format_for_competition

router = APIRouter()
retriever = Retriever()
annotator = Annotator()

# In-memory job store: job_id -> {"text": str, "chunk_size": int, ...}
_job_store: dict[str, dict] = {}


def _load_icl_examples() -> None:
    """Seed ChromaDB with the OpenSeek ICL examples at startup."""
    examples_path = Path(__file__).parent.parent / "data" / "examples" / "openseeek_icl_examples.json"
    if not examples_path.exists():
        return
    with open(examples_path) as f:
        raw = json.load(f)
    examples = [
        {
            "text": item.get("text", ""),
            "annotation": json.dumps({
                "label": item.get("label", 0),
                "reasoning": item.get("reasoning", ""),
            }),
            "metadata": item.get("metadata", {}),
        }
        for item in raw
    ]
    if examples:
        retriever.add_examples(examples)


_load_icl_examples()


class DocumentRequest(BaseModel):
    text: str
    chunk_size: int = 512
    chunk_overlap: int = 20
    top_k: int = 3


@router.post("/api/annotate")
async def start_annotation(req: DocumentRequest):
    """Store the document and pipeline config, return a job_id for streaming."""
    job_id = str(uuid.uuid4())
    _job_store[job_id] = {
        "text": req.text,
        "chunk_size": req.chunk_size,
        "chunk_overlap": req.chunk_overlap,
        "top_k": req.top_k,
    }
    return {"job_id": job_id, "status": "started"}


@router.get("/api/stream/{job_id}")
async def stream_annotation(
    job_id: str,
    text: str = "",
    chunk_size: int = 512,
    chunk_overlap: int = 20,
    top_k: int = 3,
):
    """
    Stream SSE pipeline progress.
    Resolves document from job_store (POST flow), then text query param, then default.
    """
    job = _job_store.pop(job_id, None)
    if job:
        doc_text = job["text"]
        chunk_size = job["chunk_size"]
        chunk_overlap = job["chunk_overlap"]
        top_k = job["top_k"]
    elif text:
        doc_text = text
    else:
        doc_text = "This is a very long legal document. " * 50

    async def event_generator():
        yield f"data: {json.dumps({'step': 'init', 'message': 'Pipeline started'})}\n\n"
        await asyncio.sleep(0.5)

        # 1. Chunking
        yield f"data: {json.dumps({'step': 'chunking', 'message': f'Chunking document (size: {chunk_size}, overlap: {chunk_overlap})...'})}\n\n"
        chunks = chunk_document(doc_text, chunk_size=chunk_size, chunk_overlap=chunk_overlap)
        yield f"data: {json.dumps({'step': 'chunk_complete', 'chunks': chunks})}\n\n"
        await asyncio.sleep(0.5)

        all_annotations = []

        for i, chunk in enumerate(chunks):
            # 2. Retrieve
            yield f"data: {json.dumps({'step': 'retrieving', 'chunk_idx': i, 'message': f'Retrieving top {top_k} examples for chunk {i}...'})}\n\n"
            examples = retriever.get_top_k(chunk, k=top_k)
            yield f"data: {json.dumps({'step': 'retrieve_complete', 'chunk_idx': i, 'examples': examples})}\n\n"

            # 3. Build Prompt
            yield f"data: {json.dumps({'step': 'building_prompt', 'chunk_idx': i, 'message': f'Building prompt for chunk {i}...'})}\n\n"
            prompt = annotator.build_prompt(chunk, examples)
            await asyncio.sleep(0.3)

            # 4. Annotate
            yield f"data: {json.dumps({'step': 'annotating', 'chunk_idx': i, 'message': f'Annotating chunk {i}...'})}\n\n"
            result = await annotator.annotate(prompt, chunk)
            result["chunk_idx"] = i
            result["raw_text"] = chunk
            all_annotations.append(result)

            yield f"data: {json.dumps({'step': 'annotate_complete', 'chunk_idx': i, 'result': result})}\n\n"

        # 5. Merge
        yield f"data: {json.dumps({'step': 'merging', 'message': 'Merging chunk annotations...'})}\n\n"
        final_result = merge_annotations(all_annotations)
        await asyncio.sleep(0.5)

        # 6. Format for OpenSeek competition submission
        competition = format_for_competition(final_result, all_annotations, document_id=job_id)

        yield f"data: {json.dumps({'step': 'done', 'final_result': final_result, 'competition': competition})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
