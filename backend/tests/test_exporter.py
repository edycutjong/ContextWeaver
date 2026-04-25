import json
from core.exporter import (
    format_for_competition,
    format_evaluation_only,
    _extract_binary_label,
    _generate_doc_id,
)


def test_format_for_competition_basic():
    final_result = {
        "mean_confidence": 0.85,
        "total_chunks_processed": 2,
        "merged_entities": [],
    }
    chunks = [
        {"annotation": '{"label": 1, "reasoning": "Correct"}', "confidence": 0.9, "label": 1, "reasoning": "Correct"},
        {"annotation": '{"label": 0, "reasoning": "Wrong"}', "confidence": 0.7, "label": 0, "reasoning": "Wrong"},
    ]

    result = format_for_competition(final_result, chunks, document_id="test_doc")

    assert result["submission"]["document_id"] == "test_doc"
    assert result["submission"]["model"] == "qwen3-4b"
    assert result["submission"]["total_chunks"] == 2
    assert len(result["submission"]["predictions"]) == 2
    assert len(result["evaluation_pairs"]) == 2

    # Check evaluation pairs format
    for pair in result["evaluation_pairs"]:
        assert "id" in pair
        assert "label" in pair
        assert pair["label"] in (0, 1)


def test_format_for_competition_auto_doc_id():
    result = format_for_competition({"mean_confidence": 0.5}, [])
    assert result["submission"]["document_id"].startswith("doc_")


def test_format_evaluation_only():
    predictions = [
        {"id": "chunk_001", "label": 1, "confidence": 0.9},
        {"id": "chunk_002", "label": 0, "confidence": 0.6},
    ]
    pairs = format_evaluation_only(predictions)

    assert len(pairs) == 2
    assert pairs[0] == {"id": "chunk_001", "label": 1}
    assert pairs[1] == {"id": "chunk_002", "label": 0}


def test_extract_binary_label_direct():
    assert _extract_binary_label({"label": 1}) == 1
    assert _extract_binary_label({"label": 0}) == 0


def test_extract_binary_label_from_annotation():
    chunk = {"annotation": '{"label": 1, "reasoning": "ok"}'}
    assert _extract_binary_label(chunk) == 1


def test_extract_binary_label_from_entities():
    chunk = {"annotation": '{"entities": [{"type": "ORG"}]}'}
    assert _extract_binary_label(chunk) == 1

    chunk_empty = {"annotation": '{"entities": []}'}
    assert _extract_binary_label(chunk_empty) == 0


def test_extract_binary_label_confidence_fallback():
    assert _extract_binary_label({"confidence": 0.8}) == 1
    assert _extract_binary_label({"confidence": 0.3}) == 0


def test_extract_binary_label_invalid_json():
    chunk = {"annotation": "not valid json"}
    # Should not crash — falls through to confidence fallback
    result = _extract_binary_label(chunk)
    assert result in (0, 1)


def test_generate_doc_id():
    doc_id = _generate_doc_id()
    assert doc_id.startswith("doc_")
    assert len(doc_id) == 16  # "doc_" + 12 hex chars


def test_format_metadata():
    final_result = {"mean_confidence": 0.92, "total_chunks_processed": 5}
    result = format_for_competition(final_result, [])

    assert result["metadata"]["mean_confidence"] == 0.92
    assert result["metadata"]["pipeline_version"] == "1.0.0"
