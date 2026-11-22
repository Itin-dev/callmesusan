# Progress

Track multi-session work here. Update at the end of each meaningful session.

## Current status

- Status: hackathon finished (21 November 2026). The MVP stays live at
  <https://callmesusan.vercel.app> as a showcase; no active development.
- Last updated: 2026-11-22

## Done

- Decision logged: [#1](https://github.com/Itin-dev/callmesusan/issues/1) — challenge "Beyond the List" (PostFinance)
- Demo data: two accounts, one year of transactions, five store-app receipts, receipt photos for the scan demo
- Backend: accounts, transactions with linked receipts, spending summaries and categories,
  receipt scan (vision model) matched to payments, voice to text, Psst chat grounded in the data
- Frontend: Home, account detail, transaction with receipt, receipt scan, Analytics with Ask Psst,
  Psst chat with pitch-question chips and voice input; five languages including Arabic RTL
- Pitch deck: [docs/Pitch.pdf](docs/Pitch.pdf)
- After the event: Add receipt photo scans directly from a payment and asks before adding the
  receipt (#91, #92); the demo scan fallback is off in production

## Ideas for later

See the roadmap in [docs/features.md](docs/features.md): tax savings plan, payday reminder,
upcoming bills, statement on request, document help.
