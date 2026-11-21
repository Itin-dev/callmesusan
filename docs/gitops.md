# GitOps

## Branch first

Never implement on `main`. Create `feature/...` or `fix/...` from an updated `main`.

## Hooks equal CI

| Event | What runs |
|-------|-----------|
| commit | `scripts/validate.sh` + Conventional Commit message check |
| new branch (checkout) | warns if it starts from an old `main` (`scripts/check-fresh-base.sh --warn`) |
| push | blocks a branch missing new `main` commits (fix: `git pull origin main`), then `scripts/validate.sh --pre-push` |
| GitHub Actions | same `scripts/validate.sh` |

Do not invent a second check path.

## Pull requests and merging

- `main` is protected: changes land via PR, and the `validate` check must pass.
- No reviews are required. Merge your own PR once `validate` is green (`gh pr merge --squash --delete-branch`).
- Discord gets a message when a PR is opened (or leaves draft) and when it is merged to `main`
  (`.github/workflows/notify-discord.yml`). Draft PRs stay quiet until marked ready.

### Discord notification setup (one time)

1. Discord: channel settings → Integrations → Webhooks → New Webhook → copy URL.
2. GitHub: `gh secret set DISCORD_WEBHOOK_URL` and paste the URL.

Without the secret, the workflow skips silently.

## Team questions channel

`bash scripts/ask-team.sh "<question>"` posts a question to a dedicated Discord channel,
shown as a card with the asker's name, GitHub avatar (via `gh`), a per-person color and the
current branch, so teammates are easy to tell apart. It is send-only (an incoming webhook):
teammates answer in Discord as usual. `--dry-run` prints the message without sending it.

Mentions are disabled (`@everyone` cannot ping) and messages are capped at 2000 characters.
Never put secrets, tokens or personal data in a question.

### Setup (one time per teammate)

1. Discord: create the channel (e.g. `#agent-questions`) → channel settings → Integrations →
   Webhooks → New Webhook → copy URL. One person does this and shares the URL privately.
2. Each teammate: add `DISCORD_QUESTIONS_WEBHOOK_URL=<url>` to their local `.env`.
   The URL is a secret — anyone holding it can post to the channel. Never commit it.

## Project board

Board: <https://github.com/orgs/Itin-dev/projects/1> — created and kept in sync by
`bash scripts/setup-project.sh` (idempotent; edit `TEAM` there to change editors).

Columns: Backlog → Todo → In progress → Review → Done. Areas are issue labels (`area:*`),
not board fields, so there is one place to set them.

New issues land in **Backlog**: they are proposals (often drafted by an agent) until the team
agrees on scope and drags them to **Todo**. Only Todo tickets are picked up.

Priorities are issue labels too: `P0` (demo must-have) → `P1` (jury wow) → `P2` (stretch).

Card flow:

| Event | Status | Mechanism |
|-------|--------|-----------|
| Issue created | Backlog | built-in **Item added to project** |
| Team agrees on scope | Todo | a person drags the card |
| Work starts on #n | In progress | `bash scripts/start-task.sh <n>` (assigns, branches, moves card) |
| PR with `Closes #n` opened | Review | built-in **Pull request linked to issue** |
| PR merged / issue closed | Done | built-in **Pull request merged** + **Item closed** |

Built-in workflows (board → ⋯ → Workflows) cannot be set through the API. Enable once:

- **Auto-add to project:** filter `is:issue,pr is:open -label:decision`
- **Item added to project** → Backlog
- **Pull request linked to issue** → Review
- **Pull request merged** and **Item closed** → Done

## Conventional Commits

Required. Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`, `perf`, `build`.

## Versioning

None. `main` is always the deployable demo; there are no release tags or `VERSION` file.

## Service paths

Changes limited to paths in `scripts/service-paths.list` skip app-oriented pre-push gates (meta-kit / docs / agent config).

## History

No CHANGELOG. PRs are squash-merged, so `git log --oneline main` reads as the change log —
one Conventional Commit per PR. CI rejects PR titles that are not Conventional Commits.
