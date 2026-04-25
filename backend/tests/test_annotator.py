import pytest
import json
from core.annotator import Annotator


@pytest.mark.asyncio
async def test_annotator_compose_prompt():
    annotator = Annotator()
    examples = [
        {"text": "Sample input", "annotation": '{"label": 1}', "similarity_score": 0.9}
    ]
    prompt = annotator.compose_prompt("Target text", examples)

    assert "expert data annotator" in prompt
    assert "Target text" in prompt
    assert "TASK INSTRUCTION" in prompt


@pytest.mark.asyncio
async def test_annotator_build_prompt_legacy():
    """Legacy build_prompt delegates to compose_prompt."""
    annotator = Annotator()
    examples = [
        {"text": "Sample input", "annotation": '{"entities": []}', "similarity_score": 0.9}
    ]
    prompt = annotator.build_prompt("Target text", examples)

    assert "expert data annotator" in prompt
    assert "Target text" in prompt


@pytest.mark.asyncio
async def test_annotator_annotate_simulation():
    annotator = Annotator()
    assert not annotator.use_real_api

    result = await annotator.annotate("Prompt text", "Chunk text to extract from with more than five words")

    assert "annotation" in result
    assert "confidence" in result
    assert "prompt" in result
    assert "label" in result
    assert "reasoning" in result

    assert result["prompt"] == "Prompt text"
    assert 0.50 <= result["confidence"] <= 1.0
    assert result["label"] in (0, 1)

    annotation_data = json.loads(result["annotation"])
    assert "label" in annotation_data
    assert "confidence" in annotation_data
    assert "reasoning" in annotation_data


@pytest.mark.asyncio
async def test_annotator_annotate_returns_binary_label():
    annotator = Annotator()
    result = await annotator.annotate("Test prompt", "Some input text for annotation testing")

    assert isinstance(result["label"], int)
    assert result["label"] in (0, 1)


@pytest.mark.asyncio
async def test_annotator_compose_prompt_with_instruction():
    annotator = Annotator()
    examples = [
        {"text": "Math problem", "annotation": '{"label": 1}', "similarity_score": 0.85}
    ]
    prompt = annotator.compose_prompt(
        "Solve 2+2=4",
        examples,
        instruction="Determine if the math is correct."
    )
    assert "Determine if the math is correct" in prompt


@pytest.mark.asyncio
async def test_annotator_compose_prompt_no_qualified_examples():
    annotator = Annotator()
    # Examples below default similarity threshold
    examples = [
        {"text": "Irrelevant", "annotation": '{}', "similarity_score": 0.1}
    ]
    prompt = annotator.compose_prompt("Target text", examples)

    # Should still produce a valid prompt (zero-shot)
    assert "Target text" in prompt
    assert "expert data annotator" in prompt


@pytest.mark.asyncio
async def test_annotator_annotate_real_api():
    annotator = Annotator()
    annotator.use_real_api = True

    # Mock _annotate_real to avoid network calls and verify branching
    async def mock_annotate_real(prompt, chunk_text):
        return {
            "annotation": '{"label": 1}',
            "confidence": 0.99,
            "prompt": prompt,
            "label": 1,
            "reasoning": "mock reasoning"
        }

    annotator._annotate_real = mock_annotate_real

    result = await annotator.annotate("Prompt text", "Chunk text")

    assert result["reasoning"] == "mock reasoning"
    assert result["label"] == 1
