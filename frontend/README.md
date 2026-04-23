# ContextWeaver Dashboard

The frontend dashboard for **ContextWeaver**, built with Next.js 16, React Flow, and Tailwind CSS v4.

*Targeted for the **FlagOS Open Computing Global Challenge**, jointly hosted by FlagOS Community, BAAI, and CCF ODTC.*

## Features
- **Pipeline Visualization**: React Flow nodes mapping the Chunk → Retrieve → Annotate → Merge pipeline.
- **Confidence Heatmaps**: Visual grids indicating the LLM's confidence scores for extracted entities.
- **Live Stream Tracking**: Subscribes to backend SSE (Server-Sent Events) to visualize chunks arriving in real-time.

## Development

```bash
npm install
npm run dev
```

> **Note**: For full functionality, ensure the backend FastAPI service is running on port 8000. You can start the entire stack from the root directory using `make dev` or `docker compose up`.
