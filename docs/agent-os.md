# Agent OS

Claude Code setup for this template: skills, hooks, and plugins. Claude Code is the only supported agent.

## Entrypoints

- Claude Code: [CLAUDE.md](../CLAUDE.md) (loaded automatically every session)
- Docs: [INDEX.md](INDEX.md)

## Skills (`.claude/skills/`)

Project skills (always present):

| Skill | Role |
|-------|------|
| `generic-project` | Layout, SoC, libraries-first |
| `generic-workflow` | Branch / hooks / GitOps |
| `generic-language` | English-only |
| `generic-docker` | Microservices + Compose |
| `generic-cleanliness` | Tidy repo checklist |
| `capture` | Voice/typed input → GitHub issues (decisions, tickets, ideas, recap) |
| `ask-team` | Questions the user can't answer → team Discord channel (`scripts/ask-team.sh`) |
| `caveman*` / `cavecrew` | Token efficiency |

### Recommended community skills

Installed by `bootstrap.sh --with-recommended-skills` via the [skills CLI](https://github.com/vercel-labs/skills) (`--agent claude-code`):

| Skill | Source |
|-------|--------|
| `test-driven-development` | [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) |
| `security-and-hardening` | addyosmani/agent-skills |
| `planning-and-task-breakdown` | addyosmani/agent-skills |
| `skill-creator` | [anthropics/skills](https://github.com/anthropics/skills) |

Code review: use `caveman-review` (vendored).

Opt-in (stack recipes / as needed):

- `performance` (addyosmani)
- `backend-development`, `web-development`, `web-testing`, `cybersecurity` ([rubencr14/agent-skills](https://github.com/rubencr14/agent-skills))
- `frontend-design`, `mcp-builder` (anthropics)

### Discovery registries

- [skills.sh](https://skills.sh)
- [claude-plugins.dev](https://claude-plugins.dev)

Pin installs in `skills-lock.json` when the CLI writes one.

## Enforcement

Docs and skills are guidance. **Enforcement** is layered so agents cannot casually bypass flows:

| Layer | What | Can model ignore? |
|-------|------|-------------------|
| Claude hook `guard_parallel_work.py` (PreToolUse) | Agents cannot create git worktrees (one task at a time) | No |
| Git hooks (`.githooks`) | `validate.sh` on commit/push; Conventional Commits | No (unless bypassed with `--no-verify`) |
| Branch protection on `main` | PR required, `validate` CI check must pass | No (server-side) |
| `CLAUDE.md` | Binding workflow instructions | Soft |
| Skills / docs | Procedures and checklists | Soft — use for how-to |

If an agent tries to skip validation or push to `main`, git hooks and branch protection block it. Prefer fixing the failure over disabling hooks.

## Plugins

Do not commit a `plugins/` tree. Install Claude Code plugins per machine with `/plugin`; document team recommendations in CLAUDE.md.
