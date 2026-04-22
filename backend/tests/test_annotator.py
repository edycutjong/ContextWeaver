import pytest
import json
from core.annotator import Annotator

@pytest.mark.asyncio
async def test_annotator_build_prompt():
    annotator = Annotator()
    examples = [
        {"text": "Sample input", "annotation": '{"entities": []}'}
    ]
    prompt = annotator.build_prompt("Target text", examples)
    
    assert "System: You are an expert data annotator" in prompt
    assert "Sample input" in prompt
    assert "Target text" in prompt

@pytest.mark.asyncio
async def test_annotator_annotate():
    annotator = Annotator()
    result = await annotator.annotate("Prompt text", "Chunk text to extract from with more than five words")
    
    assert "annotation" in result
    assert "confidence" in result
    assert "prompt" in result
    
    assert result["prompt"] == "Prompt text"
    assert 0.70 <= result["confidence"] <= 0.99
    
    annotation_data = json.loads(result["annotation"])
    assert "entities" in annotation_data
    assert "summary" in annotation_data
