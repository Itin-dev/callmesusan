# Deploy (Vercel)

Production: <https://aihackatontest.vercel.app> (health: `/api/health`).

One Vercel project serves the whole app:

| Part | Served as | Source |
|---|---|---|
| Frontend | Static files at `/` | `apps/web` build → `apps/web/dist` |
| Backend | Python serverless function at `/api/*` | `api/index.py` → FastAPI app in `services/api/app` |

Config: [`vercel.json`](../vercel.json). Python dependencies: root `requirements.txt`, generated
from `services/api/uv.lock` with `make requirements` (`validate` fails when it is out of date).

## Pipeline

| Event | CI (GitHub Actions) | CD (Vercel Git integration) |
|---|---|---|
| PR opened / updated | `validate` must pass | Preview deploy; Vercel comments the URL on the PR |
| Merge to `main` | `validate` runs again | Production deploy |

Branch protection only lets green PRs into `main`, so production always gets validated code.

## One-time setup

1. [vercel.com/new](https://vercel.com/new) → import the GitHub repo. Keep **Root Directory** as
   the repo root; `vercel.json` sets build, output and functions.
2. Project → Settings → Environment Variables: `OPENROUTER_API_KEY` (and optionally
   `OPENROUTER_MODEL`) for Production and Preview.
3. Deploy, then check `https://<project>.vercel.app/api/health` → `{"status":"ok"}`.

## Preview access

Preview URLs are behind Vercel Authentication by default: only members of the Vercel account can
open them. To share previews with teammates or the jury, turn it off under Project → Settings →
Deployment Protection (the API holds no user data; the OpenRouter key stays server-side).

## Limits to keep in mind

- No WebSockets and no local disk that survives requests; keep the API stateless.
- `maxDuration` is 60 s per request (`vercel.json`); long LLM chains need streaming or another host.
- Request bodies are capped at 4.5 MB (fine for short voice clips).
