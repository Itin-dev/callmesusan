# Plan

Use this file for large or multi-session work. Keep it short and current.

## Goal

Team **Call me Susan** builds a working prototype for the challenge **Beyond the List**
(PostFinance AG) at the "AI for Access" hackathon by Powercoders x Tech & Beyond
(Bern, 20–21 November 2026, code freeze Saturday 18:00).

> What if your bank could do more than show transactions and actually help you make smarter decisions?

Decision: [#1](https://github.com/Itin-dev/callmesusan/issues/1).
Source: [challenges](https://hackathon.powercoders.org/en/#challenges).

Tags: AI/ML, software, data, UX.

## Scope

- In: a banking companion demo that reads a user's transactions and turns them into
  understandable insights and suggestions (AI at the core, not decoration).
- Out: real bank integration, authentication, real customer data — the demo uses mock data.
- Exact features: to be decided by the team (capture as `Idea` / `Ticket`).

## Approach

1. Agree on target user and the one demo moment for the jury.
2. Break the work into tickets, with one branch and one pull request per ticket.
3. Build the demo on the existing stack (FastAPI + React + OpenRouter, see `docs/stack.md`).
4. Update `PROGRESS.md` at the end of each work block.

## Risks / open questions

- Target user is not defined yet (newcomers? low financial literacy? language barriers?).
- No real bank data — mock transactions must look realistic enough for the demo.
- Financial advice must stay explanatory, not regulated investment advice.
- The Figma files may still hold content from the previous topic and need checking.
- The Vercel project URL (`aihackatontest.vercel.app`) still comes from the template; confirm
  the production URL for this repo.
