import pytest
from core.retriever import Retriever

def test_retriever_add_and_get():
    # Use a specific collection name for testing so we don't clash with prod
    retriever = Retriever(collection_name="test_examples")
    
    # Clear any existing documents if this runs multiple times
    try:
        if retriever.collection.count() > 0:
            retriever.client.delete_collection("test_examples") # pragma: no cover
            retriever = Retriever(collection_name="test_examples") # pragma: no cover
    except Exception: # pragma: no cover
        pass
        
    examples = [
        {"text": "Apple is a fruit", "annotation": '{"fruit": "apple"}'},
        {"text": "Carrot is a vegetable", "annotation": '{"veg": "carrot"}'}
    ]
    
    retriever.add_examples(examples)
    
    # Test retrieval
    results = retriever.get_top_k("What is an Apple?", k=1)
    
    assert len(results) == 1
    assert "Apple is a fruit" in results[0]["text"]
    assert results[0]["annotation"] == '{"fruit": "apple"}'
    assert "similarity_score" in results[0]

def test_retriever_empty():
    retriever = Retriever(collection_name="test_empty")
    try:
        retriever.client.delete_collection("test_empty")
        retriever = Retriever(collection_name="test_empty")
    except Exception: # pragma: no cover
        pass
        
    results = retriever.get_top_k("Query against empty", k=1)
    assert len(results) == 0


