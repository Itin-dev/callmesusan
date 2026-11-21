---
name: generic-workflow
description: Ticket lifecycle on the Hackathon project board (Backlog → Todo → In progress → Review → Done), its rules and restrictions, branch-first git flow, hooks validation and PR rules. Use when the user asks to take, work on, pick up, start or implement an issue/ticket/task ("take #50", "next ticket"), asks about ticket status or the board, and when committing, pushing, opening PRs, or setting up a new clone.
---

# generic-workflow

Do every step yourself. Never ask the user to run commands.

## The board

Project **Hackathon** (<https://github.com/orgs/Itin-dev/projects/1>), field **Status**:

| Status | Meaning | Who moves the card there |
|--------|---------|--------------------------|
| Backlog | Proposed, scope not agreed | automatic when an issue is added |
| Todo | Agreed by the team, ready to pick up | humans only |
| In progress | Someone is on it | **you**, via `scripts/start-task.sh` |
| Review | PR open | automatic: PR with `Closes #n` opened |
| Done | Merged or closed | automatic: PR merged / issue closed; dragging here closes the issue |

Labels, not board fields, carry the rest:

- Priority: `P0` demo must-have → `P1` jury wow → `P2` stretch.
- Area: `area:fe`, `area:be`, `area:ai`, `area:devops`, `area:design`, `area:pitch`.
- `decision` and `idea` issues are records, not work: never start, assign or close them.

## Ticket lifecycle

1. **Pick.** The user names an issue ("take #33"), or says "next ticket": choose the
   highest-priority (`P0` → `P1` → `P2`) unassigned issue in **Todo** and tell the user which
   one. Never pick from Backlog: those tickets are proposals the team has not agreed on.
   ```bash
   gh project item-list 1 --owner Itin-dev --limit 200 --format json \
     -q '.items[] | select(.status=="Todo") | "#\(.content.number) \(.labels) \(.assignees) \(.title)"'
   ```
2. **Start** — before touching any code:
   ```bash
   bash scripts/start-task.sh <n>
   ```
   Assigns the issue to the current `gh` user, creates `feature/<n>-<slug>` (`fix/…` for `bug`
   issues) from fresh `main`, moves the card to **In progress**. Board warnings do not block
   work; mention them to the user (usually `gh auth refresh -s project`).
3. **Understand.** `gh issue view <n>`; follow its Tasks and Done-when, and the Figma link in it.
4. **Implement.** Test first for logic (`test-driven-development`); stay inside the issue scope.
5. **Open the PR yourself.** Conventional Commit title; body starts with `Closes #<n>` (the
   template has the line) → card moves to **Review**.
6. **Merge** only when the user says so and `validate` is green → card moves to **Done**,
   issue closes, Discord is notified.

## Restrictions

- Do not start an issue assigned to someone else, in **Backlog**, or labelled
  `decision`/`idea`. Ask the user instead.
- Do not move cards to **Review** or **Done** by hand and do not close issues yourself —
  the PR does it. Exception: the user explicitly asks (e.g. drop a ticket → close as not planned).
- **One task at a time.** Do not start a new issue while another is in progress (ticket branch
  checked out, uncommitted changes, or an open PR you are driving) — propose it or capture it
  and wait for the user. `start-task.sh` refuses while you have another assigned issue with a
  branch (`--parallel` only on the user's explicit say-so). Never create git worktrees: the
  `PreToolUse` hook `.claude/hooks/guard_parallel_work.py` blocks them.
- One issue per branch and per PR. Found extra work? Create a new ticket (`capture` skill),
  do not widen the current PR.
- Never work on `main`, never `--no-verify`, never force-push `main`.
- Do not change priorities, assignees of others, or board columns unless the user asks.
- Done means merged to `main`, not "code written".

## Work without an issue

Small chores (docs, config) may skip the board:

```bash
git checkout main && git pull
git checkout -b feature/short-description   # or fix/…, docs/…
```

Leave `Closes #` out of the PR body.

## Automation

After `bash scripts/bootstrap.sh` (run automatically by the SessionStart hook):

| Action | Automatic check |
|--------|-----------------|
| commit | blocks `main`, `scripts/validate.sh`, Conventional Commits |
| push | `scripts/validate.sh --pre-push` |
| PR | CI `validate` + Conventional PR title |
| merge to main | Discord notification (`notify-discord.yml`) |

No reviews are required. PRs are squash-merged, so the PR title is the commit message.

## Docs in the same PR

Update `docs/INDEX.md` when docs change. Board setup and the built-in workflows are documented
in `docs/gitops.md`.
