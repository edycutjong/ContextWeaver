"""
Patch chromadb's DefaultEmbeddingFunction before any test module is imported.

This prevents ONNX model loading during test collection, which fails when the
model file is corrupted or unavailable. The replacement uses word-hash embeddings
that preserve enough semantic similarity for retrieval tests to pass correctly
(e.g. "What is an Apple?" correctly retrieves "Apple is a fruit" over
"Carrot is a vegetable" because they share the word "apple").
"""
import re
import hashlib
from unittest.mock import MagicMock, patch


def _word_hash_embed_patched(self, input):  # noqa: A002
    embeddings = []
    for text in input:
        words = re.findall(r'[a-z]+', text.lower())
        vec = [0.0] * 384
        for word in words:
            dim = int(hashlib.md5(word.encode()).hexdigest(), 16) % 384
            vec[dim] += 1.0
        norm = sum(v * v for v in vec) ** 0.5
        vec = [v / norm for v in vec] if norm > 0 else ([1.0] + [0.0] * 383)
        embeddings.append(vec)
    return embeddings


# Must be at module level so the patch is active before test files are collected
patch('chromadb.utils.embedding_functions.DefaultEmbeddingFunction.__call__', _word_hash_embed_patched).start()
