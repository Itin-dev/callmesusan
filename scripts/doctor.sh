#!/usr/bin/env bash
# Check that this machine matches the team dev setup. Prints a fix for each problem.
#
# Usage:
#   bash scripts/doctor.sh          # full report
#   bash scripts/doctor.sh --quiet  # only problems (used by the Claude Code SessionStart hook)
#
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT" || exit 1

QUIET=false
[ "${1:-}" = "--quiet" ] && QUIET=true

PROBLEMS=0
ok()  { [ "$QUIET" = true ] || echo "  ✅ $1"; }
bad() { echo "  ❌ $1"; echo "     fix: $2"; PROBLEMS=$((PROBLEMS + 1)); }
has() { command -v "$1" >/dev/null 2>&1; }

[ "$QUIET" = true ] || echo "Team dev setup check"

# --- Git ---------------------------------------------------------------------
name="$(git config user.name || true)"
email="$(git config user.email || true)"
if [ -z "$name" ] || [ -z "$email" ]; then
  bad "git identity not set" 'git config --global user.name "Your Name" && git config --global user.email "<id>+<login>@users.noreply.github.com"'
elif [[ "$name" == *"[bot]"* ]]; then
  bad "git identity is a bot ($name) — commits would not be yours" 'git config user.name "Your Name" && git config user.email "<your GitHub noreply email>"'
else
  ok "git identity: $name"
fi

if [ "$(git config --get core.hooksPath || true)" = ".githooks" ]; then
  ok "git hooks enabled"
else
  bad "git hooks not enabled" "bash scripts/bootstrap.sh"
fi

# --- GitHub CLI --------------------------------------------------------------
if ! has gh; then
  bad "gh CLI missing" "brew install gh && gh auth login"
elif ! gh auth status >/dev/null 2>&1; then
  bad "gh not logged in" "gh auth login"
elif ! gh auth status 2>&1 | grep -q "'project'"; then
  bad "gh token lacks 'project' scope (needed for the board)" "gh auth refresh -s project"
else
  ok "gh logged in with project scope"
fi

# --- Validation tools (CI parity) --------------------------------------------
if has python3 && python3 -c 'import sys; sys.exit(sys.version_info < (3, 9))'; then
  ok "python3 $(python3 -c 'import platform; print(platform.python_version())')"
else
  bad "python3 >= 3.9 missing" "brew install python"
fi
if has pre-commit; then ok "pre-commit"; else bad "pre-commit missing" "brew install pre-commit"; fi
if has shellcheck; then ok "shellcheck"; else bad "shellcheck missing" "brew install shellcheck"; fi

# --- Agent -------------------------------------------------------------------
if has claude; then ok "claude CLI"; else bad "Claude Code CLI missing" "see https://docs.claude.com/en/docs/claude-code (or use the VS Code extension)"; fi

# --- STACK: FastAPI (uv) + React (Node) --------------------------------------
if has uv; then ok "uv $(uv --version | cut -d' ' -f2)"; else bad "uv missing" "brew install uv"; fi
if has node && [ "$(node -p 'process.versions.node.split(".")[0]')" -ge 22 ]; then
  ok "node $(node --version)"
else
  bad "node >= 22 missing" "brew install node"
fi
if [ -d services/api/.venv ]; then ok "api dependencies"; else bad "api dependencies not installed" "bash scripts/bootstrap.sh"; fi
if [ -d apps/web/node_modules ]; then ok "web dependencies"; else bad "web dependencies not installed" "bash scripts/bootstrap.sh"; fi
if [ -f .env ] && grep -q '^OPENROUTER_API_KEY=.\+' .env; then
  ok ".env with OPENROUTER_API_KEY"
else
  bad ".env missing or OPENROUTER_API_KEY empty" "cp .env.example .env and paste the team key (ask in Discord)"
fi

if [ "$PROBLEMS" -gt 0 ]; then
  echo "  $PROBLEMS setup problem(s). Re-run: bash scripts/doctor.sh"
  exit 1
fi
[ "$QUIET" = true ] || echo "  All good."
exit 0
