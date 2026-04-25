"""
Annotator — Qwen3-4B annotation engine.

Currently runs in SIMULATION mode for local development.
When the API key is available, set QWEN_API_KEY and QWEN_API_URL
environment variables to switch to real Qwen3-4B inference.

Simulation mode generates realistic binary labels with confidence scores
matching the OpenSeek competition format.
"""
import asyncio
import json
import os
import random

from core.prompt_builder import build_prompt

# Environment variables for real Qwen3-4B API (set when available)
QWEN_API_URL = os.environ.get("QWEN_API_URL", "")
QWEN_API_KEY = os.environ.get("QWEN_API_KEY", "")
MAX_RETRIES = 3


class Annotator:
    def __init__(self):
        self.use_real_api = bool(QWEN_API_URL and QWEN_API_KEY)

    def compose_prompt(self, chunk_text: str, examples: list[dict], instruction: str = "") -> str:
        """
        Build a targeted prompt using the prompt_builder module.
        Delegates to the centralized prompt builder with schema enforcement,
        similarity filtering, and token budget management.
        """
        kwargs = {"chunk_text": chunk_text, "examples": examples}
        if instruction:
            kwargs["instruction"] = instruction
        return build_prompt(**kwargs)

    # Keep legacy method for backward compatibility with existing tests
    def build_prompt(self, chunk_text: str, examples: list[dict]) -> str:
        """Legacy prompt builder — delegates to compose_prompt."""
        return self.compose_prompt(chunk_text, examples)

    async def annotate(self, prompt: str, chunk_text: str) -> dict:
        """
        Annotate a chunk using either real Qwen3-4B API or simulation.

        Returns:
            dict with keys: annotation, confidence, prompt, label
        """
        if self.use_real_api:
            return await self._annotate_real(prompt, chunk_text)
        return await self._annotate_simulated(prompt, chunk_text)

    async def _annotate_real(self, prompt: str, chunk_text: str) -> dict:
        """
        Real Qwen3-4B API call with JSON schema enforcement and retries.

        TODO: Wire in when API key is obtained from FlagOS competition portal.
        - Set QWEN_API_URL and QWEN_API_KEY environment variables
        - This method will be called automatically
        """
        import httpx  # pragma: no cover

        for attempt in range(MAX_RETRIES):  # pragma: no cover
            try:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    response = await client.post(
                        QWEN_API_URL,
                        headers={
                            "Authorization": f"Bearer {QWEN_API_KEY}",
                            "Content-Type": "application/json",
                        },
                        json={
                            "model": "qwen3-4b",
                            "messages": [
                                {"role": "system", "content": "You are an expert data annotator. Output ONLY valid JSON."},
                                {"role": "user", "content": prompt},
                            ],
                            "temperature": 0.1,
                            "max_tokens": 256,
                            "response_format": {"type": "json_object"},
                        },
                    )
                    response.raise_for_status()
                    data = response.json()
                    content = data["choices"][0]["message"]["content"]
                    parsed = json.loads(content)

                    label = parsed.get("label", 0)
                    confidence = parsed.get("confidence", 50) / 100.0
                    reasoning = parsed.get("reasoning", "")

                    return {
                        "annotation": content,
                        "confidence": round(min(max(confidence, 0.0), 1.0), 2),
                        "prompt": prompt,
                        "label": int(label),
                        "reasoning": reasoning,
                    }
            except (json.JSONDecodeError, KeyError, httpx.HTTPError) as _err:
                if attempt == MAX_RETRIES - 1:
                    # Final retry failed — return low-confidence fallback
                    return {
                        "annotation": json.dumps({"label": 0, "confidence": 10, "reasoning": "API error — fallback"}),
                        "confidence": 0.10,
                        "prompt": prompt,
                        "label": 0,
                        "reasoning": f"API error after {MAX_RETRIES} retries",
                    }
                await asyncio.sleep(1.0 * (attempt + 1))

        # Unreachable, but satisfies type checker
        return {"annotation": "{}", "confidence": 0.0, "prompt": prompt, "label": 0, "reasoning": "unreachable"}  # pragma: no cover

    async def _annotate_simulated(self, prompt: str, chunk_text: str) -> dict:
        """
        Simulation mode — generates realistic binary labels with confidence.
        Produces output matching the OpenSeek competition format.
        """
        # Simulate network/LLM latency
        await asyncio.sleep(random.uniform(0.3, 1.5))

        # Simulate binary label (weighted toward correct = 1)
        label = 1 if random.random() > 0.25 else 0
        confidence = round(random.uniform(0.60, 0.99), 2)

        # Simulate reasoning
        reasoning_templates = [
            "The content presents factually accurate information consistent with established knowledge.",
            "Key claims in the text are verifiable and logically coherent.",
            "The text contains inaccuracies in its core assertions.",
            "Analysis of the input reveals consistent and well-structured argumentation.",
            "The mathematical reasoning follows correct logical steps.",
            "Code implementation demonstrates correct algorithmic approach.",
            "The question-answer pair aligns with domain knowledge.",
            "Classification criteria are met based on textual features.",
        ]
        reasoning = random.choice(reasoning_templates)

        result = {
            "label": label,
            "confidence": int(confidence * 100),
            "reasoning": reasoning,
        }

        # Also include legacy entity extraction for dashboard compatibility
        entities = []
        words = chunk_text.split()
        if len(words) > 5:
            entities.append({"type": "ORG", "value": words[random.randint(0, len(words) - 1)]})

        annotation_data = {
            "label": label,
            "confidence": int(confidence * 100),
            "reasoning": reasoning,
            "entities": entities,
            "summary": f"Binary classification for chunk: label={label}",
        }

        return {
            "annotation": json.dumps(annotation_data),
            "confidence": confidence,
            "prompt": prompt,
            "label": label,
            "reasoning": reasoning,
        }
