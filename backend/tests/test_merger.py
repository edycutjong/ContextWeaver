import json
from core.merger import merge_annotations

def test_merge_annotations():
    annotations = [
        {
            "annotation": json.dumps({"entities": [{"type": "PERSON", "value": "Alice"}], "summary": "Chunk 1"}),
            "confidence": 0.85
        },
        {
            "annotation": json.dumps({"entities": [{"type": "ORG", "value": "Acme Corp"}, {"type": "PERSON", "value": "Alice"}], "summary": "Chunk 2"}),
            "confidence": 0.95
        }
    ]
    
    result = merge_annotations(annotations)
    
    assert result["total_chunks_processed"] == 2
    assert result["mean_confidence"] == 0.90
    assert len(result["merged_entities"]) == 2
    
    entity_values = [e["value"] for e in result["merged_entities"]]
    assert "Alice" in entity_values
    assert "Acme Corp" in entity_values

def test_merge_annotations_empty():
    result = merge_annotations([])
    assert result["total_chunks_processed"] == 0
    assert result["mean_confidence"] == 0.0
    assert result["merged_entities"] == []

def test_merge_annotations_invalid_json():
    annotations = [
        {
            "annotation": "invalid json",
            "confidence": 0.5
        }
    ]
    result = merge_annotations(annotations)
    assert result["total_chunks_processed"] == 1
    assert result["mean_confidence"] == 0.5
    assert result["merged_entities"] == []
