import asyncio
import json
import random

class Annotator:
    def __init__(self):
        # We simulate the LLM to avoid heavy downloads for local dev
        pass
        
    def build_prompt(self, chunk_text: str, examples: list[dict]) -> str:
        prompt = "System: You are an expert data annotator.\n\n"
        prompt += "Here are some examples of similar annotations:\n"
        for ex in examples:
            prompt += f"Input: {ex['text']}\n"
            prompt += f"Output: {ex['annotation']}\n\n"
            
        prompt += f"Now annotate the following text:\nInput: {chunk_text}\nOutput: "
        return prompt

    async def annotate(self, prompt: str, chunk_text: str) -> dict:
        """
        Simulate LLM processing and return structured JSON with confidence.
        """
        # Simulate network/LLM latency
        await asyncio.sleep(random.uniform(0.5, 2.0))
        
        # Simulate confidence score (0.7 to 0.99)
        confidence = round(random.uniform(0.70, 0.99), 2)
        
        # Simulate extraction logic
        entities = []
        words = chunk_text.split()
        if len(words) > 5:
            # Just grab some random words to pretend we extracted entities
            entities.append({"type": "ORG", "value": words[random.randint(0, len(words)-1)]})
            
        result = {
            "entities": entities,
            "summary": f"Simulated summary for chunk starting with '{chunk_text[:20]}...'",
        }
        
        return {
            "annotation": json.dumps(result),
            "confidence": confidence,
            "prompt": prompt
        }
