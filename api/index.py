"""Vercel serverless entrypoint: exposes the FastAPI app from services/api.

Vercel serves Python functions from the top-level api/ folder; vercel.json rewrites
/api/* here. Keep this file thin — all logic lives in services/api/app.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "services" / "api"))

from app.main import app  # noqa: E402

__all__ = ["app"]
