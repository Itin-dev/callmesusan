#!/usr/bin/env bash
# Stack checks (called by validate.sh): FastAPI backend + React frontend.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "  api: ruff + pytest (services/api)"
(
  cd services/api
  uv run --frozen ruff check .
  uv run --frozen ruff format --check .
  uv run --frozen pytest -q
  # Vercel installs from the root requirements.txt; it must match uv.lock.
  if ! uv export --frozen --no-dev --no-hashes --no-emit-project --no-header -q \
    | diff -q - ../../requirements.txt >/dev/null; then
    echo "  requirements.txt is out of date — run: make requirements" >&2
    exit 1
  fi
)

echo "  web: oxlint + vitest + tsc + build (apps/web)"
if [ ! -d apps/web/node_modules ]; then
  echo "  apps/web/node_modules missing — run: bash scripts/bootstrap.sh" >&2
  exit 1
fi
npm --prefix apps/web run --silent check
