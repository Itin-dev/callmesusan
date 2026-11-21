# services/

Backend services. One subdirectory per service, one responsibility each.

| Service | Purpose |
| --- | --- |
| [`api/`](api/) | Psst API (FastAPI): accounts, transactions with receipts, spending summaries, receipt scan, voice to text and the Psst chat |

Run it with `make api` (<http://localhost:8000>, OpenAPI docs at `/docs`). Tests:
`cd services/api && uv run pytest`. Conventions: [docs/stack.md](../docs/stack.md).
On Vercel the app runs as a serverless function through [`api/index.py`](../api/index.py).
