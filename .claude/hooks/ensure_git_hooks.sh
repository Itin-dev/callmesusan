#!/usr/bin/env bash
# SessionStart hook: make sure every teammate's clone uses the repo git hooks,
# and warn the agent when the session starts on main.
set -euo pipefail
cd "${CLAUDE_PROJECT_DIR:-.}"

notes=()
if [ "$(git config --get core.hooksPath || true)" != ".githooks" ]; then
  git config core.hooksPath .githooks
  chmod +x .githooks/* 2>/dev/null || true
  notes+=("Enabled repo git hooks (core.hooksPath=.githooks).")
fi
if [ "$(git branch --show-current 2>/dev/null || true)" = "main" ]; then
  notes+=("You are on main. Create a feature/... or fix/... branch before changing files.")
fi
if [ "${#notes[@]}" -gt 0 ]; then
  printf '%s\n' "${notes[@]}"
fi

# Report machine setup drift (identity, gh scopes, tools) so the agent can tell the user.
bash scripts/doctor.sh --quiet || true
