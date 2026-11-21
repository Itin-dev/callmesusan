# Tech stack

Inherited from the team template.

| Part | Path | Tech |
| --- | --- | --- |
| Backend | `services/api/` | Python 3.12, FastAPI, uv, pytest, ruff |
| Frontend | `apps/web/` | Vite, React, TypeScript, Tailwind v4, shadcn/ui, lucide-react, React Router, i18next, Vitest, oxlint |
| AI | `services/api/app/llm.py` | OpenRouter via the `openai` SDK (OpenAI-compatible API); models per task in [AI models](#ai-models) |

## Run locally

```bash
make api   # http://localhost:8000  (docs: /docs)
make web   # http://localhost:5173  (proxies /api → :8000)
```

`.env` at the repo root holds `OPENROUTER_API_KEY` and the model settings below (see `.env.example`).

## AI models

Team decision (21 Nov 2026): one model per task, all through OpenRouter. Model ids live in `.env`,
never in code, so they can change without a deploy of new code.

| Task | Model | Setting |
| --- | --- | --- |
| Voice to text (chat mic input) | `google/gemini-3.5-flash-lite` | `OPENROUTER_TRANSCRIBE_MODEL` |
| Receipt photo (`POST /api/receipts/scan`) | `google/gemini-3.5-flash-lite` reads the photo directly (vision) into the receipt JSON schema | `OPENROUTER_VISION_MODEL` |
| Receipt photo, OCR step (not built) | OpenRouter `file-parser` plugin, engine `mistral-ocr`. Left out for the pitch: the vision step read all three test photos correctly in one call | `OPENROUTER_OCR_ENGINE` |
| Psst chat over the dataset (`POST /api/chat`) | `openai/gpt-6-luna` | `OPENROUTER_MODEL` |

If the vision step fails and `DEMO_SCAN_FALLBACK=1` is set (for the pitch), the scan endpoint
returns its prepared result for the LOLA test photo, marked `"fallback": true`, so the demo never
breaks and the app can label it. Without the flag it answers 502, and without
`OPENROUTER_VISION_MODEL` it answers 503 (BE-6, #40). Tests never call a model: they override
`get_llm` with a fake.
Until the backend reads these settings, `app/config.py` defaults `OPENROUTER_MODEL` to `openrouter/auto`.

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
  "language": "de" }       // en|de|uk|ru|ar, default "en"
// response
{ "reply": "..." }
```

The system prompt comes from `SYSTEM_PROMPT` in `.env` (default in `app/config.py`). Logic: `app/chat.py`.

## Frontend UI

- Components come from [shadcn/ui](https://ui.shadcn.com) (`npx shadcn add <name>` in `apps/web`,
  RTL mode on); icons from `lucide-react`, except the PostFinance icons exported from Figma in
  `src/assets/icons/`. Do not hand-roll a component shadcn already has.
- Styling uses the Figma design tokens only — see [design-tokens.md](design-tokens.md).
- Accessibility is required: semantic HTML, 44px+ touch targets, logical CSS (`ms-`/`me-`, not
  `ml-`/`mr-`) so Arabic RTL works. Page tests run `axe-core` and must report no violations.
- Languages: EN, DE, UK, RU, AR in `src/i18n/locales/*.json`; switching language updates `<html lang dir>`.
- Light theme only for the MVP (the Figma file has one mode).
- Mobile first: design width 390 px (works from 320 px, fills phones up to iPhone Pro Max). From
  `sm` up, `AppShell` shows the 390 × 844 Figma phone frame centred on the page.
- No business logic in the UI. Screens read data through React Query hooks in `src/api/queries.ts`;
  `src/api/*` holds the fetch calls and contract types (`docs/mvp.md`). Totals, matching, insights
  come from the backend. The UI only formats (`src/lib/money.ts`) and lays out. Until an endpoint
  exists, its function in `src/api/` returns a typed fixture with the contract shape.
- Use `cn` from `@/lib/utils`: it knows the custom type scale (`text-caption`, ...).

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
