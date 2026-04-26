import pytest
import json
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_start_annotation():
    response = client.post("/api/annotate", json={"text": "Hello world"})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "started"
    assert "job_id" in data
    assert len(data["job_id"]) > 0


def test_start_annotation_with_settings():
    response = client.post("/api/annotate", json={
        "text": "Document text",
        "chunk_size": 256,
        "chunk_overlap": 10,
        "top_k": 2,
    })
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "started"
    assert "job_id" in data


def test_stream_annotation_default():
    with client.stream("GET", "/api/stream/job_123") as response:
        assert response.status_code == 200
        lines = list(response.iter_lines())
        assert len(lines) > 0
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


def test_stream_annotation_includes_competition_format():
    with client.stream("GET", "/api/stream/test_competition?text=Short test document for competition output") as response:
        assert response.status_code == 200
        lines = list(response.iter_lines())
        done_lines = [l for l in lines if '"done"' in l and l.strip()]
        assert len(done_lines) > 0
        done_data = json.loads(done_lines[-1].replace("data: ", ""))
        assert "competition" in done_data
        assert "evaluation_pairs" in done_data["competition"]
        assert isinstance(done_data["competition"]["evaluation_pairs"], list)


def test_annotate_then_stream():
    # POST to create a job with the document stored
    post_resp = client.post("/api/annotate", json={
        "text": "Brief test document for end-to-end job flow.",
        "chunk_size": 200,
        "chunk_overlap": 20,
        "top_k": 2,
    })
    assert post_resp.status_code == 200
    job_id = post_resp.json()["job_id"]

    # GET stream resolves document from job_store
    with client.stream("GET", f"/api/stream/{job_id}") as response:
        assert response.status_code == 200
        lines = list(response.iter_lines())
        data_lines = [line for line in lines if line]
        assert any("Pipeline started" in line for line in data_lines)
        assert any("done" in line for line in data_lines)
        # Competition format present
        done_lines = [l for l in data_lines if '"done"' in l]
        done_data = json.loads(done_lines[-1].replace("data: ", ""))
        assert "competition" in done_data


def test_load_icl_examples_missing_file():
    from unittest.mock import patch
    from api.endpoints import _load_icl_examples
    with patch("api.endpoints.Path.exists", return_value=False):
        _load_icl_examples()
