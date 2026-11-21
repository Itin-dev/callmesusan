#!/usr/bin/env bash
# shellcheck disable=SC2016  # $vars inside GraphQL queries are GraphQL variables
# Create (or update) the team's GitHub Project board. Idempotent.
#
# Usage: bash scripts/setup-project.sh
# Needs: gh with the `project` scope (gh auth refresh -s project).
#
# Result: project "Hackathon" linked to this repo, Status columns
# Backlog → Todo → In progress → Review → Done, TEAM members as writers.
# Built-in workflow "auto-add" cannot be enabled through the API — see docs/gitops.md.
set -euo pipefail

TITLE="Hackathon"
# Board editors (GitHub logins). Logins removed here lose their project role on the next run.
TEAM=(mystique4u lumbri 3Nplus1)
REMOVED=(makovstanislav ShkrSltn)
REPO="$(gh repo view --json nameWithOwner --jq .nameWithOwner)"
OWNER="${REPO%%/*}"

number="$(gh project list --owner "$OWNER" --format json \
  --jq ".projects[] | select(.title == \"$TITLE\") | .number" | head -n 1)"
if [ -z "$number" ]; then
  number="$(gh project create --owner "$OWNER" --title "$TITLE" --format json --jq .number)"
  echo "Created project #$number"
else
  echo "Project #$number exists"
fi

project_id="$(gh project view "$number" --owner "$OWNER" --format json --jq .id)"
gh project link "$number" --owner "$OWNER" --repo "$REPO" >/dev/null 2>&1 || true
gh project edit "$number" --owner "$OWNER" \
  --description "Hackathon board for $REPO" >/dev/null

# Status columns (replaces the default Todo / In Progress / Done options).
# Rewriting options changes their IDs and clears every card's status, so only
# do it when the columns differ from the wanted set.
status_id="$(gh project field-list "$number" --owner "$OWNER" --format json \
  --jq '.fields[] | select(.name == "Status") | .id')"
current="$(gh project field-list "$number" --owner "$OWNER" --format json \
  --jq '.fields[] | select(.name == "Status") | [.options[].name] | join(",")')"
if [ "$current" = "Backlog,Todo,In progress,Review,Done" ]; then
  echo "Status columns already set"
else
gh api graphql -f query='
mutation($field: ID!) {
  updateProjectV2Field(input: {
    fieldId: $field
    singleSelectOptions: [
      {name: "Backlog",     color: GRAY,   description: "Not planned yet"}
      {name: "Todo",        color: BLUE,   description: "Ready to pick up"}
      {name: "In progress", color: YELLOW, description: "Someone is on it"}
      {name: "Review",      color: PURPLE, description: "PR open"}
      {name: "Done",        color: GREEN,  description: "Merged or closed"}
    ]
  }) { projectV2Field { ... on ProjectV2SingleSelectField { name } } }
}' -f field="$status_id" >/dev/null
echo "Status columns set"
fi

set_role() {
  local user_id
  user_id="$(gh api "users/$1" --jq .node_id)"
  gh api graphql -f query='
  mutation($project: ID!, $user: ID!, $role: ProjectV2Roles!) {
    updateProjectV2Collaborators(input: {
      projectId: $project
      collaborators: [{userId: $user, role: $role}]
    }) { clientMutationId }
  }' -f project="$project_id" -f user="$user_id" -f role="$2" >/dev/null
  echo "$2: $1"
}
for login in "${TEAM[@]}"; do set_role "$login" WRITER; done
for login in "${REMOVED[@]}"; do set_role "$login" NONE; done

echo "Board: $(gh project view "$number" --owner "$OWNER" --format json --jq .url)"
