"""
Competition Exporter — Formats annotation output for OpenSeek submission.

Maps ContextWeaver's internal annotation format to the FlagOS competition
submission schema: {id, label} pairs for accuracy evaluation.
"""
import json
import hashlib
from datetime import datetime


def format_for_competition(
    final_result: dict,
    processed_chunks: list[dict],
    document_id: str = "",
) -> dict:
    """
    Format pipeline output for FlagOS OpenSeek competition submission.

    Args:
        final_result: Merged pipeline result (from merger.py)
        processed_chunks: List of annotated chunk results
        document_id: Optional document identifier

    Returns:
        Competition-formatted dict with predictions and metadata
    """
    doc_id = document_id or _generate_doc_id()

    predictions = []
    for i, chunk in enumerate(processed_chunks):
        chunk_id = f"{doc_id}_chunk_{i:03d}"

        # Extract binary label from chunk annotation
        label = _extract_binary_label(chunk)
        confidence = chunk.get("confidence", 0.0)
        reasoning = chunk.get("reasoning", "")

        predictions.append({
            "id": chunk_id,
            "label": label,
            "confidence": round(confidence, 4),
            "reasoning": reasoning,
        })

    return {
        "submission": {
            "format_version": "openseeek_v1",
            "document_id": doc_id,
            "model": "qwen3-4b",
            "pipeline": "contextweaver-icl",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "total_chunks": len(processed_chunks),
            "predictions": predictions,
        },
        "evaluation_pairs": [
            {"id": p["id"], "label": p["label"]}
            for p in predictions
        ],
        "metadata": {
            "mean_confidence": final_result.get("mean_confidence", 0.0),
            "total_chunks_processed": final_result.get("total_chunks_processed", 0),
            "pipeline_version": "1.0.0",
        },
    }


def format_evaluation_only(predictions: list[dict]) -> list[dict]:
    """
    Extract minimal {id, label} pairs for competition evaluation upload.

    This is the exact format the competition evaluation server expects.
    """
    return [
        {"id": p["id"], "label": p["label"]}
        for p in predictions
    ]


def _extract_binary_label(chunk: dict) -> int:
    """Extract binary label from chunk annotation data."""
    # Direct label field (from upgraded annotator)
    if "label" in chunk:
        return int(chunk["label"])

    # Parse from annotation JSON string
    annotation_str = chunk.get("annotation", "")
    if annotation_str:
        try:
            data = json.loads(annotation_str)
            if "label" in data:
                return int(data["label"])
            # Legacy: infer from entities (presence = 1, empty = 0)
            if "entities" in data:
                return 1 if data["entities"] else 0
        except (json.JSONDecodeError, TypeError, ValueError):
            pass

    # Fallback: confidence-based threshold
    confidence = chunk.get("confidence", 0.5)
    return 1 if confidence >= 0.5 else 0


def _generate_doc_id() -> str:
    """Generate a short deterministic document ID from timestamp."""
    ts = datetime.utcnow().isoformat()
    return "doc_" + hashlib.sha256(ts.encode()).hexdigest()[:12]
