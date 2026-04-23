<div align="center">
  <img src="frontend/public/window.svg" alt="ContextWeaver Logo" width="150">
  <h1>ContextWeaver 🚀</h1>
  <p><em>Dynamic In-Context Learning Router for Intelligent Data Annotation</em></p>
  
  [![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen.svg)](https://github.com/edycutjong/contextweaver)
  [![Pitch Video](https://img.shields.io/badge/Pitch-Video-red.svg)](https://youtube.com/)
  <br />
  [![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
  [![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![FastAPI](https://img.shields.io/badge/FastAPI-0.109-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
  [![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)](https://python.org/)
  [![Qwen](https://img.shields.io/badge/Qwen-3--4B-blueviolet)](https://github.com/QwenLM/Qwen)
  [![Docker](https://img.shields.io/badge/Docker-24.0-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
  [![GNU Make](https://img.shields.io/badge/GNU_Make-4.3-424242?logo=gnu&logoColor=white)](https://www.gnu.org/software/make/)
</div>

---

## 📸 See it in Action

*(Dashboard showcasing the live data annotation pipeline)*
![App Demo](https://via.placeholder.com/800x400?text=ContextWeaver+Dashboard+Demo)

## 💡 The Problem & Solution

In today's world, annotating long-context documents with smaller LLMs (like Qwen3-4B) fails due to lost-in-the-middle phenomena and context dilution from static few-shot examples. 

**ContextWeaver** solves this by reframing prompt construction as a retrieval problem—applying RAG to In-Context Learning itself. 

**Key Features:**
- ⚡ **Dynamic Retrieval:** For each document chunk, ChromaDB retrieves the top-3 most semantically relevant examples.
- 🎯 **Targeted Prompts:** Reduces a 100k-token monolithic prompt into focused ~4,000-token prompts per chunk.
- 🎨 **Visual Tracing:** A real-time Next.js and React Flow dashboard that animates data flow and provides a 3-column Chunk Inspector for total transparency.

## 🏗️ Architecture & Tech Stack

We built the frontend using **Next.js 16**, **React 19**, and **Tailwind CSS v4**, visualizing the pipeline with **React Flow**. The backend is powered by **Python FastAPI**, using **ChromaDB** and **sentence-transformers** for vector retrieval, and simulating the **Qwen3-4B** model for data annotation.

### System Architecture

```mermaid
graph TB
    subgraph "Next.js Dashboard"
        A["📄 Document Upload"]
        B["🔀 React Flow Pipeline"]
        C["📊 Confidence Heatmap"]
        D["📋 Results Explorer"]
    end

    subgraph "FastAPI Backend"
        E["📑 Semantic Chunker"]
        F["🔍 ICL Example Retriever"]
        G["🧩 Prompt Builder"]
        H["🤖 Qwen3-4B Annotator"]
        I["🔗 Result Merger"]
    end

    subgraph "Data Layer"
        J["ChromaDB — ICL Examples"]
        K["Local FS — Documents"]
        L["JSON — Final Dataset"]
    end

    A -->|"Upload PDF/TXT"| E
    E -->|"Chunk[]"| F
    F -->|"top-3 examples/chunk"| J
    J -->|"similar examples"| G
    G -->|"4k-token prompt"| H
    H -->|"Qwen3-4B API"| I
    I -->|"merged annotations"| L

    E -.->|"progress events"| B
    F -.->|"retrieval events"| B
    H -.->|"annotation events"| B
    I -.->|"confidence data"| C
    L -.->|"final results"| D
```

### Data Flow — Annotation Pipeline

```mermaid
sequenceDiagram
    participant UI as Next.js Dashboard
    participant API as FastAPI
    participant Chunk as Chunker
    participant VDB as ChromaDB
    participant PB as Prompt Builder
    participant LLM as Qwen3-4B
    participant Merge as Merger

    UI->>API: POST /annotate {document, config}
    API->>Chunk: split(document, chunk_size=2048, overlap=0.15)
    Chunk-->>API: Chunk[] (n chunks)
    
    loop For each chunk
        API->>VDB: query(chunk.embedding, top_k=3)
        VDB-->>API: ICL examples[]
        API->>PB: build_prompt(chunk, examples, schema)
        PB-->>API: formatted prompt (~4k tokens)
        API->>LLM: generate(prompt, json_mode=true)
        LLM-->>API: {annotations, confidence, reasoning}
        API-->>UI: SSE: chunk_completed {id, status, confidence}
    end

    API->>Merge: merge(all_chunk_results)
    Merge-->>API: unified_dataset.json
    API-->>UI: SSE: pipeline_complete {accuracy_estimate, stats}
```

## 🏆 Sponsor Tracks Targeted

* **FlagOS Open Computing Global Challenge**: Submitted to **Track 3 — Automatic Data Annotation with Large Models in Long-Context Scenarios**. We effectively optimize the context window for Qwen3-4B.

**Jointly hosted by:**
* FlagOS Community
* Beijing Academy of Artificial Intelligence (BAAI)
* CCF Open Source Development Technology Committee (ODTC)

## 🚀 Run it Locally (For Judges)

We have made running the project as frictionless as possible. Just use the included Makefile:

1. **Clone the repo:** `git clone https://github.com/edycutjong/contextweaver.git`
2. **Navigate to directory:** `cd contextweaver`
3. **Install dependencies:** `make install`
4. **Run the app:** `make dev`

> **Note for Judges:** 
> The `make dev` command will start both the FastAPI backend (Port 8000) and the Next.js frontend (Port 3000) concurrently.
> Simply navigate to **http://localhost:3000** in your browser and click "Run Document Annotation" to see the live simulation!
