"""The Vercel entrypoint (api/index.py at the repo root) must expose the same FastAPI app."""

import importlib.util
from pathlib import Path

from fastapi.testclient import TestClient

ENTRYPOINT = Path(__file__).resolve().parents[3] / "api" / "index.py"


def load_entrypoint_app():
    spec = importlib.util.spec_from_file_location("vercel_entrypoint", ENTRYPOINT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.app


def test_entrypoint_serves_health():
    response = TestClient(load_entrypoint_app()).get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
