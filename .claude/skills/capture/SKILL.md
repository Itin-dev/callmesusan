---
name: capture
description: Turns dictated or typed team input into GitHub issues — decisions, tickets, ideas — and recaps them for Discord. Use when a prompt starts with a trigger word "Decision", "Ticket", "Idea" or "Recap" (including misheard dictation variants such as "tick it", "we decided", "re cap"), or when the user asks to log a decision, create a ticket/issue, save an idea, or summarize today's team activity.
---

# capture

Voice-first capture for the team. Input usually comes from speech dictation, so expect
filler words, run-on sentences, mixed languages and misheard tech terms.
Output always goes to GitHub issues through the `gh` CLI — the single shared store.

## Modes

The first word of the prompt selects the mode (the `capture_trigger.py` hook also announces it):

| Trigger (and variants) | Mode | Result |
|---|---|---|
| Decision, Decided, We decided | decision | Issue labelled `decision`, then closed as a record |
| Ticket, Tickets, Tick it, Todo | ticket | Open issue with an `area:*` label, added to the project board |
| Idea, Ideas | idea | Open issue labelled `idea` (team votes with 👍) |
| Recap, Re cap | recap | Discord-ready summary of today's issues (no writes) |

If no trigger word is present but the user clearly asks for one of these, pick the matching mode.

## Team resources

Three Figma files, one role each. Figma is where the team thinks and designs; the GitHub board
is where work is tracked. Content flows **Figma → GitHub issues**, never the other way.

| Role | File | Contents | Becomes on GitHub |
|---|---|---|---|
| Project guide | [Core project info](https://www.figma.com/board/u8YyBh0deFEbRGSNhzfKJB/Core-project-info) (FigJam) | Project description, hackathon and partner KUNIGO, key problems and themes, the two personas (Amina and Carlos), product description with the three agent modes, final feature list | `idea` issues and feature tickets; personas referenced as "Target user" |
| Pitch deck | [Presentation](https://www.figma.com/slides/cb3hUbajEGqza7XUGuQfCj) (Figma Slides) | Project presentation (structure to be defined) | `area:pitch` tickets |
| Final app design | [Design-Project](https://www.figma.com/design/oOu7PPG4eIaWZPFVOELCCI/Design-Project) (Figma Design) | Screens and components — source of truth for the UI | `area:fe` / `area:design` tickets, one per screen |

When an issue refers to a Figma file ("on the board", "the sticky about …", "our persona …",
"the result screen", "the slides"), add a `**Figma:** <link>` line to the body. Pick the file by
role (screens / UI → Design-Project, slides / pitch → Presentation, everything else including
personas and features → Core project info) unless the speaker gives a more specific frame link.

To transfer Figma content, read it in the chat session through the `figma` MCP server
(`.mcp.json`; each teammate signs in once via `/mcp`), then create the issues with this skill.
Example: "Ticket: one issue per screen in Design-Project" or "Idea: the stickies in section X".

## Normalize the input first

1. Drop the trigger word, filler ("um", "so basically", "like") and repetitions.
2. Write everything in **English** (repo language rule), whatever language was spoken.
3. Fix misheard terms: "next js" → Next.js, "open router" → OpenRouter, "fig ma" → Figma,
   "get hub" → GitHub, "tail wind" → Tailwind, "react" stays React.
4. One utterance may hold several items ("ticket: A, and also B") — create one issue per item.
5. Keep the speaker's meaning. Do not invent requirements, owners or deadlines.

## Never block

Create issues immediately and report the links. Do not ask for confirmation.
Ask a question only when the input is unintelligible. If the area is unclear, choose the
most likely one and say so in the reply.

## Labels

Areas: `area:fe`, `area:be`, `area:ai`, `area:devops`, `area:design`, `area:pitch`.
Types: `decision`, `idea`. Created by `bash scripts/setup-labels.sh` (run once).

Area hints: UI/screens/components → fe · API/data/storage → be · prompts/models/OpenRouter → ai ·
CI/deploy/hosting/env → devops · Figma/UX/flows → design · slides/demo/story/jury → pitch.

## Commands

Write each body to a temp file in the scratchpad and pass `--body-file` (avoids quoting bugs).

### decision

Title: `Decision: <what was decided>` (≤ 70 chars).

```markdown
**Decision:** <one sentence>

**Why:** <reasons given; omit if none>

**Alternatives considered:** <omit if none>

**Follow-ups:** <tickets implied by the decision; omit if none>

<details><summary>Original dictation</summary>

<raw input>
</details>
```

```bash
url=$(gh issue create --title "Decision: ..." --label decision --body-file "$BODY")
gh issue close "$url" --reason completed
```

If the decision implies concrete work, offer (in the reply) to create the follow-up tickets.

### ticket

Title: imperative, ≤ 70 chars ("Add login screen", not "Login screen should be added").

```markdown
## Goal
<one or two sentences>

## Tasks
- [ ] <step>

## Done when
- <observable result>

<details><summary>Original dictation</summary>

<raw input>
</details>
```

```bash
gh issue create --title "..." --label "area:<x>" --body-file "$BODY" --project "Hackathon"
```

- If `--project` fails (no board yet, or missing `project` token scope), retry without it and
  mention `gh auth refresh -s project` in the reply.
- Assign only when the speaker says so: "for me" → `--assignee @me`; a GitHub handle → that handle.

### idea

Title: `Idea: <short name>`.

```markdown
**Problem:** <who struggles with what>

**Target user:** <who>

**AI usage:** <how AI is central, not decorative>

**10-hour scope:** <smallest demoable version>

**Demo moment:** <what the jury sees in 3 minutes>

**Open questions:** <omit if none>

<details><summary>Original dictation</summary>

<raw input>
</details>
```

Leave unknown fields as `_TBD_` rather than inventing content.

```bash
gh issue create --title "Idea: ..." --label idea --body-file "$BODY"
```

### recap

```bash
gh issue list --state all --limit 100 \
  --search "created:>=$(date +%Y-%m-%d)" \
  --json number,title,labels,state,url
```

Reply with Markdown ready to paste into Discord (stay under 2000 characters):

```markdown
**Recap — <date>**
**Decisions**
• <title> (#n)
**New tickets**
• <title> — <area> (#n)
**Ideas**
• <title> (#n)
```

Omit empty sections. If the user says "recap since <time/day>", adjust the search date.

## Reply format

One line per created issue: `✅ <mode> #<n> <title> — <url>`, plus any note about guessed
areas or failed project linking. Nothing else.
