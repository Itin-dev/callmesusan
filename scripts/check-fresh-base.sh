#!/usr/bin/env bash
# Fail when a branch does not contain the latest origin/main (it was started from a stale main).
# Usage: check-fresh-base.sh [--warn] [commit]   (commit defaults to HEAD)
#   --warn  print the problem but always exit 0 (used by the post-checkout hook)
# Offline / no origin: warns and passes, so work never stalls on network issues.
set -euo pipefail

mode="block"
if [ "${1:-}" = "--warn" ]; then
  mode="warn"
  shift
fi
commit="${1:-HEAD}"

if ! git fetch --quiet origin main 2>/dev/null; then
  echo "check-fresh-base: could not fetch origin/main, skipping freshness check." >&2
  exit 0
fi

if git merge-base --is-ancestor FETCH_HEAD "$commit"; then
  exit 0
fi

behind="$(git rev-list --count "$commit..FETCH_HEAD")"
cat >&2 <<EOF
Your branch is missing $behind new commit(s) from main (it was started from an old main).
Update it before pushing:
  git pull origin main
EOF
[ "$mode" = "warn" ] && exit 0
exit 1
