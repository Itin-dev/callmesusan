#!/usr/bin/env bash
# Create or update the GitHub labels used by the `capture` skill. Idempotent.
# Usage: bash scripts/setup-labels.sh
set -euo pipefail

label() {
  gh label create "$1" --color "$2" --description "$3" --force
}

label "area:fe"     "1d76db" "Frontend / UI implementation"
label "area:be"     "0e8a16" "Backend / API / data"
label "area:ai"     "5319e7" "Prompts, models, OpenRouter"
label "area:devops" "fbca04" "CI, deploy, hosting, env"
label "area:design" "e99695" "Figma, UX, flows"
label "area:pitch"  "d93f0b" "Slides, demo, story"
label "decision"    "0052cc" "Recorded team decision"
label "idea"        "c2e0c6" "Idea for voting (react with 👍)"
