#!/usr/bin/env bash
# Fail if .gitignore hides anything under the source folders except known build artifacts.
#
# Why: an ignored source file exists on your disk, so local tests pass, but it never reaches
# the commit and CI / Vercel break (e.g. the Python `lib/` rule hiding apps/web/src/lib).
#
# Usage: bash scripts/check-ignored-sources.sh   (run from the repo root)
set -euo pipefail

SOURCE_DIRS=(apps services packages)

# Generated or local-only entries that are meant to stay ignored (matched on the basename).
is_artifact() {
  case "$1" in
    node_modules | dist | build | coverage | .vite | .vercel | .turbo) return 0 ;;
    .venv | venv | __pycache__ | .pytest_cache | .ruff_cache | .mypy_cache | *.egg-info) return 0 ;;
    *.pyc | *.pyo | *.tsbuildinfo | *.log | .DS_Store | .env | .env.*) return 0 ;;
  esac
  return 1
}

hidden=()
while IFS= read -r entry; do
  [ -n "$entry" ] || continue
  name="$(basename "${entry%/}")"
  is_artifact "$name" || hidden+=("$entry")
done < <(git ls-files --others --ignored --exclude-standard --directory -- "${SOURCE_DIRS[@]}" 2>/dev/null)

if [ "${#hidden[@]}" -gt 0 ]; then
  echo "These source paths are git-ignored, so they will be missing from the commit:" >&2
  printf '  %s\n' "${hidden[@]}" >&2
  echo "Fix .gitignore (anchor the rule, e.g. /lib/, or add a !negation) and git add them." >&2
  exit 1
fi
echo "No ignored source files."
