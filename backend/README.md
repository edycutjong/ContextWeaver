# ContextWeaver API

The high-performance data annotation orchestration layer, built with FastAPI, ChromaDB, and SentenceTransformers.

## Features
- **Dynamic Retrieval**: Uses ChromaDB to dynamically fetch relevant few-shot examples for the LLM.
- **Streaming Pipeline**: Implements `Server-Sent Events` (SSE) to push pipeline stages (Chunk → Retrieve → Annotate → Merge) directly to the frontend.
- **Mock LLM Fallback**: Includes simulated Qwen3-4B inference to guarantee fast local demonstration without massive GPU requirements.

## Development

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python main.py
```

> **Note**: The API runs on `http://localhost:8000`. You can start the entire stack from the root directory using `make dev` or `docker compose up`.
