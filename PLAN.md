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

### Context

Digital banking gives access to a lot of financial data, but individuals and businesses mostly
see it as transaction lists: account activity, payment flows, balances. The meaning behind the
data stays unclear, and users must spot relationships, trends and opportunities on their own.
Information is also spread across payment methods, accounts and financial products, so users
lack a holistic view of their situation and how it will develop.

### Problem statement

Transaction lists show individual payments but give little context about their significance,
relationships or impact. Patterns, changes and trends stay hidden. The challenge is to turn
financial data into clear, relevant, valuable information: find which insights are genuinely
useful for individuals and businesses, and use the data to give guidance, improve financial
visibility and support well-informed decisions.

### Resources

- Two CSV files with about 500 transactions over one year (two accounts, sample data), provided
  as a zip by the organizers. Location in this repo: _TBD_.

## Scope

- In: a demo that reads the sample transactions (two accounts, one year) and turns them into
  clear insights, trends and suggestions (AI at the core, not decoration).
- Out: real bank integration, authentication, real customer data — the demo uses the sample CSVs.
- Exact features: to be decided by the team (capture as `Idea` / `Ticket`).

## Approach

1. Agree on target user and the one demo moment for the jury.
2. Break the work into tickets, with one branch and one pull request per ticket.
3. Build the demo on the existing stack (FastAPI + React + OpenRouter, see `docs/stack.md`).
4. Update `PROGRESS.md` at the end of each work block.

## Risks / open questions

- Target user is not defined yet: individuals, businesses, or both? (newcomers, low financial
  literacy, language barriers?)
- Which insights are "genuinely useful" — pick a few strong ones over many weak ones.
- Financial advice must stay explanatory, not regulated investment advice.
- The Figma files may still hold content from the previous topic and need checking.
- The Vercel project URL (`aihackatontest.vercel.app`) still comes from the template; confirm
  the production URL for this repo.
