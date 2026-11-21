# Tech stack

Decided in [#19](https://github.com/Itin-dev/aihackaton_test/issues/19).

| Part | Path | Tech |
| --- | --- | --- |
| Backend | `services/api/` | Python 3.12, FastAPI, uv, pytest, ruff |
| Frontend | `apps/web/` | Vite, React, TypeScript, Tailwind v4, shadcn/ui, lucide-react, React Router, i18next, Vitest, oxlint |
| AI | `services/api/app/llm.py` | OpenRouter via the `openai` SDK (OpenAI-compatible API) |

## Run locally

```bash
make api   # http://localhost:8000  (docs: /docs)
make web   # http://localhost:5173  (proxies /api → :8000)
```

`.env` at the repo root holds `OPENROUTER_API_KEY` (and optionally `OPENROUTER_MODEL`).

## Deploy

Vercel: frontend as static files, FastAPI as a serverless function — see [deploy.md](deploy.md).

## Conventions

- All HTTP routes live under `/api` so the frontend proxy and a single deploy stay simple.
- Routes stay thin (`app/main.py`); logic goes into its own module.
- Call LLMs only through the `get_llm` dependency — tests override it with a fake, so
  tests never hit the network or cost money.
- Frontend calls relative URLs (`/api/...`), never `localhost:8000`.

## Chat API

`POST /api/chat` is stateless: the client sends the whole conversation on every turn, nothing is stored.

```jsonc
// request
{ "messages": [{ "role": "user", "content": "..." }],  // user|assistant, last one from the user
  "language": "de",        // ISO code, default "en"
  "topic": "housing" }     // optional home tile id
// response
{ "reply": "...", "mode": 2,                // 1 info, 2 referral, 3 letter
  "organization_ids": ["mieterverband-luzern"], "source_url": "https://..." }
```

The model only sees knowledge-base entries for the topic (plus emergency numbers); ids and
URLs that are not in `app/data/knowledge.json` are dropped from the response. Logic: `app/chat.py`.

## Frontend UI

- Components come from [shadcn/ui](https://ui.shadcn.com) (`npx shadcn add <name>` in `apps/web`,
  RTL mode on); icons from `lucide-react`. Do not hand-roll a component shadcn already has.
- Accessibility is required: semantic HTML, 44px+ touch targets, logical CSS (`ms-`/`me-`, not
  `ml-`/`mr-`) so Arabic RTL works. Page tests run `axe-core` and must report no violations.
- Languages: EN, DE, UK, RU, AR in `src/i18n/locales/*.json`; switching language updates `<html lang dir>`.
- Theme: light / dark / system (`src/features/theme`), stored on the device only.

## Tests (TDD)

| Part | Command | Runs in |
| --- | --- | --- |
| Backend | `cd services/api && uv run pytest` | `scripts/validate-stack.sh` |
| Frontend | `npm --prefix apps/web test` (watch) | `npm run check` in `validate-stack.sh` |

## Adding dependencies

```bash
cd services/api && uv add <package>        # dev-only: uv add --dev <package>
npm --prefix apps/web install <package>    # dev-only: add -D
```

Commit the lockfiles (`uv.lock`, `package-lock.json`). After changing backend dependencies, run
`make requirements` (Vercel installs from the root `requirements.txt`). Teammates get them via `bash scripts/bootstrap.sh`.
