#!/usr/bin/env bash
# One-command project bootstrap. Idempotent.
#
# Usage:
#   bash scripts/bootstrap.sh
#   bash scripts/bootstrap.sh --ci --name my-project [--with-recommended-skills]
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

CI_MODE=false
WITH_SKILLS=false
PROJECT_NAME=""

while [ $# -gt 0 ]; do
  case "$1" in
    --ci) CI_MODE=true; shift ;;
    --with-recommended-skills) WITH_SKILLS=true; shift ;;
    --name) PROJECT_NAME="${2:-}"; shift 2 ;;
    -h|--help)
      echo "Usage: bash scripts/bootstrap.sh [--ci] [--name NAME] [--with-recommended-skills]"
      exit 0
      ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

if [ -z "$PROJECT_NAME" ]; then
  if [ "$CI_MODE" = true ]; then
    PROJECT_NAME="$(basename "$REPO_ROOT")"
  else
    read -r -p "Project name [${PWD##*/}]: " PROJECT_NAME
    PROJECT_NAME="${PROJECT_NAME:-${PWD##*/}}"
  fi
fi

echo "Bootstrapping project='$PROJECT_NAME'"

# Light placeholder rename in key docs (generic → project name) when not staying as template
if [ "$PROJECT_NAME" != "generic" ]; then
  for f in README.md CLAUDE.md CONTRIBUTING.md; do
    if [ -f "$f" ]; then
      # Only replace title/brand mentions carefully
      sed -i "s/# generic/# ${PROJECT_NAME}/g; s/Generic — Agent/# ${PROJECT_NAME} — Agent/g; s/\*\*generic\*\*/**${PROJECT_NAME}**/g" "$f" || true
    fi
  done
fi

# Git hooks via committed .githooks (do not use `pre-commit install` — conflicts with hooksPath)
git config core.hooksPath .githooks
chmod +x .githooks/pre-commit .githooks/pre-push .githooks/commit-msg .githooks/post-checkout 2>/dev/null || true
chmod +x scripts/*.sh 2>/dev/null || true

echo "git core.hooksPath → .githooks"

# Shellcheck required for CI parity
if [ -f scripts/ensure-shellcheck.sh ]; then
  bash scripts/ensure-shellcheck.sh || echo "WARN: shellcheck install failed — validate.sh will fail until it is available"
fi

# Install pre-commit hook environments (used by validate.sh / commit-msg)
if command -v pipx &>/dev/null; then
  pipx ensurepath >/dev/null 2>&1 || true
fi
if command -v pre-commit &>/dev/null; then
  pre-commit install-hooks || true
  echo "pre-commit hook environments ready"
elif command -v pip3 &>/dev/null; then
  pip3 install --user pre-commit >/dev/null 2>&1 || pip3 install pre-commit >/dev/null 2>&1 || true
  if command -v pre-commit &>/dev/null; then
    pre-commit install-hooks || true
  else
    echo "WARN: install pre-commit (pip install pre-commit) for full validation"
  fi
else
  echo "WARN: pre-commit not found"
fi

# Stack dependencies (FastAPI + React)
if command -v uv &>/dev/null; then
  (cd services/api && uv sync --frozen) && echo "api dependencies ready"
else
  echo "WARN: uv missing (brew install uv) — api dependencies not installed"
fi
if command -v npm &>/dev/null; then
  npm --prefix apps/web ci --no-audit --no-fund && echo "web dependencies ready"
else
  echo "WARN: node/npm missing (brew install node) — web dependencies not installed"
fi
[ -f .env ] || { cp .env.example .env && echo "created .env from .env.example — add OPENROUTER_API_KEY"; }

install_recommended_skills() {
  bash scripts/install-recommended-skills.sh || echo "WARN: recommended skills install had errors (ok offline)"
}

if [ "$WITH_SKILLS" = true ] || { [ "$CI_MODE" = false ] && [ -t 0 ]; }; then
  if [ "$WITH_SKILLS" = true ]; then
    install_recommended_skills
  elif [ "$CI_MODE" = false ]; then
    read -r -p "Install recommended community skills now? [y/N] " yn
    case "$yn" in
      [Yy]*) install_recommended_skills ;;
    esac
  fi
fi

echo ""
bash scripts/doctor.sh || true
echo ""
echo "Bootstrap complete."
echo "Next:"
echo "  1. Add OPENROUTER_API_KEY to .env"
echo "  2. make api   (terminal 1)  +  make web   (terminal 2) → http://localhost:5173"
echo "  3. Work on a feature branch — hooks + CI are automatic"
