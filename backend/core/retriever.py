import uuid
import chromadb
from chromadb.utils.embedding_functions import DefaultEmbeddingFunction
from chromadb.config import Settings

# Monkey-patch chromadb telemetry to avoid positional argument errors
try:
    from chromadb.telemetry.product.posthog import Posthog
    def mock_capture(*args, **kwargs):
        pass
    Posthog.capture = mock_capture
except ImportError:
    pass

class Retriever:
    def __init__(self, collection_name: str = "icl_examples"):
        self.client = chromadb.Client(Settings(anonymized_telemetry=False))
        self.embedding_function = DefaultEmbeddingFunction() # Uses all-MiniLM-L6-v2
        self.collection = self.client.get_or_create_collection(
            name=collection_name, 
            embedding_function=self.embedding_function
        )
        
    def add_examples(self, examples: list[dict]):
        """
        Add historical annotation examples to ChromaDB.
        Expects a list of dicts with 'text', 'metadata', 'annotation'.
        """
        documents = []
        metadatas = []
        ids = []
        
        for i, example in enumerate(examples):
            # We embed the raw text so we can match new chunk texts to it
            documents.append(example["text"])
            # Store the actual annotation in metadata so we can retrieve it
            meta = example.get("metadata", {})
            meta["annotation"] = example["annotation"]
            metadatas.append(meta)
            ids.append(str(uuid.uuid4()))
            
        if documents:
            self.collection.add(
                documents=documents,
                metadatas=metadatas,
                ids=ids
            )
            
    def get_top_k(self, query: str, k: int = 3) -> list[dict]:
        """
        Retrieve the top-k most semantically relevant examples for a chunk.
        """
        results = self.collection.query(
            query_texts=[query],
            n_results=k
        )
        
        retrieved_examples = []
        if results and results['documents'] and results['documents'][0]:
            for i in range(len(results['documents'][0])):
                retrieved_examples.append({
                    "text": results['documents'][0][i],
                    "annotation": results['metadatas'][0][i].get("annotation", ""),
                    "similarity_score": 1.0 - (results['distances'][0][i] if 'distances' in results and results['distances'] else 0) # Rough similarity from distance
                })
        return retrieved_examples
