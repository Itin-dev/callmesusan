#!/usr/bin/env bash
# One-time GitHub setup for a repo created from this template. Idempotent.
# Template copies only files; this applies the settings GitHub does not copy.
#
# Usage: bash scripts/setup-repo.sh
# Needs: gh logged in as a repo admin, with the `project` scope.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"
REPO="$(gh repo view --json nameWithOwner --jq .nameWithOwner)"
echo "Setting up $REPO"

# Squash-only merges; the PR title becomes the commit; delete merged branches.
gh api -X PATCH "repos/$REPO" \
  -F allow_merge_commit=false -F allow_rebase_merge=false -F allow_squash_merge=true \
  -F delete_branch_on_merge=true \
  -f squash_merge_commit_title=PR_TITLE -f squash_merge_commit_message=PR_BODY >/dev/null
echo "Merge settings: squash only, auto-delete branches"

# main: PR + green `validate` check, no required reviews, admins included.
gh api -X PUT "repos/$REPO/branches/main/protection" --input - >/dev/null <<'JSON'
{
  "required_status_checks": {"strict": false, "contexts": ["validate"]},
  "enforce_admins": true,
  "required_pull_request_reviews": {"required_approving_review_count": 0, "dismiss_stale_reviews": true},
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": false
}
JSON
echo "Branch protection on main"

bash scripts/setup-labels.sh >/dev/null && echo "Labels"
bash scripts/setup-project.sh

if gh secret list --json name --jq '.[].name' | grep -qx DISCORD_WEBHOOK_URL; then
  echo "Discord secret already set"
elif [ -t 0 ]; then
  echo "Paste the Discord webhook URL (input hidden; Ctrl+C to skip):"
  gh secret set DISCORD_WEBHOOK_URL
else
  echo "Skipped Discord secret (run: gh secret set DISCORD_WEBHOOK_URL)"
fi

echo "Done. Each teammate: clone → bash scripts/bootstrap.sh"
