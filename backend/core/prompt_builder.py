"""
Prompt Builder — Composes targeted prompts for Qwen3-4B annotation.

Implements:
- OpenSeek competition schema enforcement (binary label output)
- Chain-of-thought reasoning instruction
- Dynamic token budget management (trims examples if prompt exceeds window)
- Cosine similarity threshold filtering (rejects examples below threshold)
"""

# Default token budget: ~4000 tokens ≈ ~16000 chars (rough 1:4 ratio)
DEFAULT_MAX_PROMPT_CHARS = 16000
DEFAULT_SIMILARITY_THRESHOLD = 0.7

SYSTEM_INSTRUCTION = """You are an expert data annotator. Your task is to analyze the given input text and produce a binary classification label.

RULES:
1. Read the full input text carefully.
2. Follow the task instruction precisely.
3. Output ONLY valid JSON in the exact schema shown below.
4. Include a confidence score (0-100) reflecting your certainty.
5. Include a brief reasoning trace explaining your decision.

OUTPUT SCHEMA:
{
  "label": 0 or 1,
  "confidence": <integer 0-100>,
  "reasoning": "<brief explanation of why you chose this label>"
}"""

EXAMPLE_TEMPLATE = """---
Task: {instruction}
Input: {text}
Label: {label}
Reasoning: {reasoning}
---"""

TASK_TEMPLATE = """TASK INSTRUCTION:
{instruction}

INPUT TEXT:
{text}

Respond with ONLY the JSON object. No other text."""


def filter_by_similarity(examples: list[dict], threshold: float = DEFAULT_SIMILARITY_THRESHOLD) -> list[dict]:
    """
    Filter ICL examples by cosine similarity score.
    Rejects examples below the threshold to avoid irrelevant demonstrations.
    """
    filtered = [
        ex for ex in examples
        if ex.get("similarity_score", 0) >= threshold
    ]
    return filtered


def estimate_chars(text: str) -> int:
    """Estimate character count for token budget management."""
    return len(text)


def build_prompt(
    chunk_text: str,
    examples: list[dict],
    instruction: str = "Determine if the following text contains accurate and correct information. Return 1 if correct, 0 if incorrect.",
    max_chars: int = DEFAULT_MAX_PROMPT_CHARS,
    similarity_threshold: float = DEFAULT_SIMILARITY_THRESHOLD,
) -> str:
    """
    Compose a targeted prompt for Qwen3-4B annotation.

    Args:
        chunk_text: The text chunk to annotate
        examples: List of ICL examples with 'text', 'annotation', 'similarity_score'
        instruction: Task-specific labeling instruction
        max_chars: Maximum prompt character budget
        similarity_threshold: Minimum similarity score for included examples

    Returns:
        Formatted prompt string ready for Qwen3-4B
    """
    # Step 1: Filter examples by similarity threshold
    qualified = filter_by_similarity(examples, similarity_threshold)

    # Step 2: Build the base prompt (system + task)
    task_section = TASK_TEMPLATE.format(instruction=instruction, text=chunk_text)
    base_prompt = f"{SYSTEM_INSTRUCTION}\n\n{task_section}"
    remaining_budget = max_chars - estimate_chars(base_prompt)

    # Step 3: Add examples within token budget (most relevant first)
    example_blocks = []
    for ex in qualified:
        # Parse the annotation to extract label
        label = _extract_label(ex.get("annotation", ""))
        reasoning = ex.get("reasoning", "Based on the content analysis.")

        block = EXAMPLE_TEMPLATE.format(
            instruction=instruction,
            text=ex.get("text", "")[:500],  # Truncate long example texts
            label=label,
            reasoning=reasoning,
        )

        if estimate_chars(block) <= remaining_budget:
            example_blocks.append(block)
            remaining_budget -= estimate_chars(block)
        else:
            # Budget exhausted — stop adding examples
            break

    # Step 4: Assemble final prompt
    if example_blocks:
        examples_section = "EXAMPLES (semantically matched to this chunk):\n" + "\n".join(example_blocks)
        return f"{SYSTEM_INSTRUCTION}\n\n{examples_section}\n\n{task_section}"
    else:
        # No qualified examples — use zero-shot with explicit instruction
        return base_prompt


def _extract_label(annotation_str: str) -> str:
    """Extract label from annotation string. Handles both JSON and raw formats."""
    import json
    try:
        data = json.loads(annotation_str)
        if "label" in data:
            return str(data["label"])
        if "entities" in data:
            return "1" if data["entities"] else "0"
    except (json.JSONDecodeError, TypeError):
        pass
    # Fallback: return raw string truncated
    return str(annotation_str)[:50]
