import json
from core.prompt_builder import (
    build_prompt,
    filter_by_similarity,
    SYSTEM_INSTRUCTION,
    DEFAULT_SIMILARITY_THRESHOLD,
)


def test_build_prompt_with_examples():
    examples = [
        {"text": "Sample input", "annotation": '{"label": 1}', "similarity_score": 0.9, "reasoning": "Correct."}
    ]
    prompt = build_prompt("Target chunk text", examples)

    assert "expert data annotator" in prompt
    assert "Target chunk text" in prompt
    assert "TASK INSTRUCTION" in prompt
    assert "EXAMPLES" in prompt
    assert "Sample input" in prompt


def test_build_prompt_zero_shot():
    """No qualified examples → zero-shot prompt."""
    examples = [
        {"text": "Low relevance", "annotation": '{}', "similarity_score": 0.1}
    ]
    prompt = build_prompt("Target text", examples)

    assert "Target text" in prompt
    assert "EXAMPLES" not in prompt


def test_build_prompt_custom_instruction():
    prompt = build_prompt(
        "2+2=4",
        [],
        instruction="Check if the math is correct.",
    )
    assert "Check if the math is correct" in prompt


def test_build_prompt_token_budget():
    """Large examples should be trimmed when budget is exceeded."""
    examples = [
        {"text": "A" * 5000, "annotation": '{"label": 1}', "similarity_score": 0.95, "reasoning": "ok"},
        {"text": "B" * 5000, "annotation": '{"label": 0}', "similarity_score": 0.90, "reasoning": "ok"},
        {"text": "C" * 5000, "annotation": '{"label": 1}', "similarity_score": 0.85, "reasoning": "ok"},
    ]
    prompt = build_prompt("Target", examples, max_chars=8000)

    # Should include at least one example but not overflow budget
    assert len(prompt) <= 10000  # some overhead allowed


def test_build_prompt_schema_format():
    prompt = build_prompt("Some text", [])

    assert '"label": 0 or 1' in prompt
    assert '"confidence"' in prompt
    assert '"reasoning"' in prompt
    assert "OUTPUT SCHEMA" in prompt


def test_filter_by_similarity():
    examples = [
        {"text": "a", "similarity_score": 0.9},
        {"text": "b", "similarity_score": 0.5},
        {"text": "c", "similarity_score": 0.8},
    ]
    filtered = filter_by_similarity(examples, threshold=0.7)
    assert len(filtered) == 2
    assert all(ex["similarity_score"] >= 0.7 for ex in filtered)


def test_filter_by_similarity_missing_score():
    examples = [
        {"text": "a"},  # no similarity_score key
        {"text": "b", "similarity_score": 0.9},
    ]
    filtered = filter_by_similarity(examples, threshold=0.7)
    assert len(filtered) == 1


def test_extract_label_json():
    from core.prompt_builder import _extract_label

    assert _extract_label('{"label": 1}') == "1"
    assert _extract_label('{"label": 0}') == "0"


def test_extract_label_entities():
    from core.prompt_builder import _extract_label

    assert _extract_label('{"entities": [{"type": "ORG"}]}') == "1"
    assert _extract_label('{"entities": []}') == "0"


def test_extract_label_fallback():
    from core.prompt_builder import _extract_label

    result = _extract_label("not json at all")
    assert isinstance(result, str)
    assert len(result) <= 50
