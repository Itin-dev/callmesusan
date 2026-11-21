#!/usr/bin/env bash
# Post a question to the team's Discord questions channel (send-only incoming webhook).
#
# Usage: bash scripts/ask-team.sh [--dry-run] "<question>"
# Needs: DISCORD_QUESTIONS_WEBHOOK_URL in the environment or in .env (see docs/gitops.md).
# --dry-run prints the JSON payload instead of sending it (no URL needed).
set -euo pipefail

MAX_LEN=2000  # keep questions short (Discord embed limit is 4096)

usage() { echo 'Usage: bash scripts/ask-team.sh [--dry-run] "<question>"' >&2; exit 2; }

# Distinct embed colors; each teammate always gets the same one (picked from their name).
PALETTE=(5793266 15548997 5763719 16705372 15418782 3447003 15105570 10181046)

# person_color <name> -> stable color from PALETTE
person_color() {
  local sum
  sum="$(printf '%s' "$1" | cksum | cut -d' ' -f1)"
  echo "${PALETTE[sum % ${#PALETTE[@]}]}"
}

# build_payload <author> <github-login> <branch> <question> -> webhook JSON
# One embed per question: the author's GitHub avatar and color tell teammates apart.
build_payload() {
  jq -n --arg author "$1" --arg login "$2" --arg branch "$3" --arg q "$4" \
    --argjson max "$MAX_LEN" --argjson color "$(person_color "$1")" '
    (if $login == "" then null else "https://github.com/" + $login + ".png" end) as $avatar
    | {
        username: ($author + "'\''s agent"),
        allowed_mentions: {parse: []},
        embeds: [{
          author: ({name: $author} + (if $avatar then {icon_url: $avatar} else {} end)),
          description: (if ($q | length) > $max then $q[0:$max - 1] + "…" else $q end),
          color: $color,
          footer: {text: $branch}
        }]
      }
    + (if $avatar then {avatar_url: $avatar} else {} end)'
}

# github_login -> GitHub username for the avatar ("" if unknown). ASK_TEAM_GITHUB_LOGIN overrides.
github_login() {
  if [ -n "${ASK_TEAM_GITHUB_LOGIN+set}" ]; then
    printf '%s\n' "$ASK_TEAM_GITHUB_LOGIN"
  else
    gh api user --jq .login 2>/dev/null || true
  fi
}

# webhook_url -> URL from the environment, else from the .env file (never sourced, only read)
webhook_url() {
  local env_file="${ASK_TEAM_ENV_FILE:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)/.env}"
  if [ -n "${DISCORD_QUESTIONS_WEBHOOK_URL:-}" ]; then
    printf '%s\n' "$DISCORD_QUESTIONS_WEBHOOK_URL"
  elif [ -f "$env_file" ]; then
    sed -n 's/^DISCORD_QUESTIONS_WEBHOOK_URL=//p' "$env_file" | tail -n 1 | tr -d '"'"'"
  fi
}

main() {
  local dry_run=false question author branch payload url
  if [ "${1:-}" = "--dry-run" ]; then dry_run=true; shift; fi
  question="${1:-}"
  [ -n "${question//[[:space:]]/}" ] || usage

  author="$(git config user.name 2>/dev/null || true)"
  branch="$(git branch --show-current 2>/dev/null || true)"
  payload="$(build_payload "${author:-$USER}" "$(github_login)" "${branch:-unknown}" "$question")"

  if [ "$dry_run" = true ]; then
    printf '%s\n' "$payload"
    exit 0
  fi

  url="$(webhook_url)"
  if [ -z "$url" ]; then
    echo "DISCORD_QUESTIONS_WEBHOOK_URL is not set. Add it to .env (see docs/gitops.md)." >&2
    exit 1
  fi
  if [[ ! "$url" =~ ^https://(discord\.com|discordapp\.com)/api/webhooks/ ]]; then
    echo "DISCORD_QUESTIONS_WEBHOOK_URL is not a Discord webhook URL." >&2
    exit 1
  fi

  curl -fsS -H "Content-Type: application/json" -d "$payload" "$url" >/dev/null
  echo "Question posted to Discord."
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  main "$@"
fi
