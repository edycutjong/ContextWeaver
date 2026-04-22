import pytest
from fastapi.testclient import TestClient
from main import app
import json

client = TestClient(app)

def test_start_annotation():
    response = client.post("/api/annotate", json={"text": "Hello world"})
    assert response.status_code == 200
    assert response.json() == {"job_id": "job_123", "status": "started"}

def test_stream_annotation_default():
    with client.stream("GET", "/api/stream/job_123") as response:
        assert response.status_code == 200
        # Streaming response, read lines
        lines = list(response.iter_lines())
        assert len(lines) > 0
        # Ensure some expected SSE data is present
        data_lines = [line for line in lines if line]
        assert any("Pipeline started" in line for line in data_lines)
        assert any("done" in line for line in data_lines)

def test_stream_annotation_custom_text():
    with client.stream("GET", "/api/stream/job_123?text=Short text to avoid long chunking") as response:
        assert response.status_code == 200
        lines = list(response.iter_lines())
        data_lines = [line for line in lines if line]
        assert any("Pipeline started" in line for line in data_lines)
        assert any("done" in line for line in data_lines)
