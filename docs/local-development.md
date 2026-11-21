# Local development

## Prefer host tools

Use local Python (via `uv`), Node and Bash on the machine. The app has no database or other services to run: the demo data ships as JSON in `services/api/app/data/`.

## Required tools (CI parity)

Local `scripts/validate.sh` must match GitHub Actions. Required on the host:

| Tool | Purpose |
|------|---------|
| `pre-commit` | Formatters + YAML/merge checks |
| `shellcheck` | Shell script lint (required — not skipped) |
| `python3` | Helper scripts |

Install shellcheck without root:

```bash
bash scripts/ensure-shellcheck.sh
# ensure ~/.local/bin is on PATH
```

`bootstrap.sh` calls `ensure-shellcheck.sh` automatically.

## Team setup check

`bash scripts/doctor.sh` verifies git identity, git hooks, `gh` login + `project` scope,
python3, pre-commit, shellcheck and the Claude CLI, and prints a fix for each problem.
Claude Code runs it (quiet mode) on every session start. Stack tools go in its `STACK` section
so every machine stays in sync.

## Bootstrap (once)

```bash
bash scripts/bootstrap.sh
```

Installs git hooks (`core.hooksPath=.githooks`), pre-commit environments, and shellcheck. After this, validation runs on commit/push automatically.

## Environment

```bash
cp .env.example .env
# edit .env — never commit it
```

## Dev Container / Codespaces

`.devcontainer/devcontainer.json` runs `bash scripts/bootstrap.sh --ci` on create.

## Manual validation (optional)

Hooks already run these. For debugging only:

```bash
bash scripts/validate.sh
make check   # if you prefer Make shortcuts
```

## Stack-specific

Stack details (run, tests, adding dependencies): [stack.md](stack.md).
