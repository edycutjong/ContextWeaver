#!/usr/bin/env python3
"""
Seed Script — Load ICL examples into ChromaDB for similarity retrieval.

Usage:
    cd backend/
    python scripts/seed_examples.py

This loads all JSON example files from data/examples/ into a ChromaDB
collection named 'icl_examples', making them available for the retriever
to match against incoming annotation chunks.
"""
import json
import os
import sys

# Add backend root to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import chromadb

EXAMPLES_DIR = os.path.join(os.path.dirname(__file__), "..", "data", "examples")
CHROMA_DIR = os.path.join(os.path.dirname(__file__), "..", "chroma_db")
COLLECTION_NAME = "icl_examples"


def load_examples() -> list[dict]:
    """Load all JSON example files from data/examples/."""
    examples = []
    for filename in os.listdir(EXAMPLES_DIR):
        if not filename.endswith(".json"):
            continue
        filepath = os.path.join(EXAMPLES_DIR, filename)
        with open(filepath, "r") as f:
            data = json.load(f)
            if isinstance(data, list):
                examples.extend(data)
            else:
                examples.append(data)
    return examples


def seed_chromadb(examples: list[dict]) -> int:
    """
    Upsert examples into ChromaDB collection.

    Returns:
        Number of examples seeded
    """
    client = chromadb.PersistentClient(path=CHROMA_DIR)

    # Delete existing collection if present (clean re-seed)
    try:
        client.delete_collection(COLLECTION_NAME)
    except ValueError:
        pass  # Collection doesn't exist yet

    collection = client.create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )

    # Prepare batch data
    ids = []
    documents = []
    metadatas = []

    for ex in examples:
        example_id = ex.get("id", f"example_{len(ids)}")
        text = ex.get("text", "")
        task_type = ex.get("task_type", "unknown")
        label = ex.get("label", 0)
        reasoning = ex.get("reasoning", "")

        # Store the annotation as metadata for retrieval
        annotation = json.dumps({
            "label": label,
            "reasoning": reasoning,
            "entities": [],
        })

        ids.append(example_id)
        documents.append(text)
        metadatas.append({
            "task_type": task_type,
            "label": str(label),
            "instruction": ex.get("instruction", ""),
            "reasoning": reasoning,
            "annotation": annotation,
            "domain": ex.get("metadata", {}).get("domain", "general"),
            "source": ex.get("metadata", {}).get("source", "unknown"),
        })

    # Batch upsert (ChromaDB handles embedding internally)
    collection.add(
        ids=ids,
        documents=documents,
        metadatas=metadatas,
    )

    return len(ids)


def main():
    print("🌱 ContextWeaver ICL Example Seeder")
    print(f"   Examples directory: {EXAMPLES_DIR}")
    print(f"   ChromaDB directory: {CHROMA_DIR}")
    print()

    examples = load_examples()
    print(f"📂 Loaded {len(examples)} examples from JSON files")

    # Group by task type for reporting
    by_type = {}
    for ex in examples:
        task = ex.get("task_type", "unknown")
        by_type[task] = by_type.get(task, 0) + 1

    for task_type, count in sorted(by_type.items()):
        label_1 = sum(1 for ex in examples if ex.get("task_type") == task_type and ex.get("label") == 1)
        label_0 = count - label_1
        print(f"   • {task_type}: {count} examples (✓ {label_1} correct, ✗ {label_0} incorrect)")

    count = seed_chromadb(examples)
    print(f"\n✅ Seeded {count} examples into ChromaDB collection '{COLLECTION_NAME}'")
    print("   Ready for similarity retrieval!")


if __name__ == "__main__":
    main()
