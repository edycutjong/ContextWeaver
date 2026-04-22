import pytest
from core.chunker import chunk_document

def test_chunk_document_basic():
    text = "This is a simple text that we want to chunk. It should be split appropriately."
    chunks = chunk_document(text, chunk_size=20, chunk_overlap=5)
    
    assert len(chunks) > 1
    assert chunks[0].startswith("This is a")

def test_chunk_document_empty():
    text = ""
    chunks = chunk_document(text, chunk_size=20, chunk_overlap=5)
    assert chunks == []

def test_chunk_document_long():
    text = "A" * 1000
    chunks = chunk_document(text, chunk_size=100, chunk_overlap=10)
    assert len(chunks) > 1
    assert len(chunks[0]) == 100
