# Psst MVP — scope, API contract, task split

The MVP has two parts:

1. **Transaction with receipt:** fake data that extends the bank transaction with what was bought
   (items, prices, categories such as dairy, coffee, chocolate, alcohol).
2. **Psst chat:** a separate chat screen where the AI uses that item-level data to show spending
   trends and suggest where and what to cut.

Design: [Figma Design-Project, page "Psst MVP"](https://www.figma.com/design/oOu7PPG4eIaWZPFVOELCCI/Design-Project?node-id=0-1).

| Figma frame | Node | In MVP |
|-------------|------|--------|
| 01 Home | `16:5` | Entry points only (Psst quick action, Psst card, account rows) |
| 02 Psst chat | `16:214` | **Yes** |
| 03 Analytics + Ask Psst | `16:118` | No (stretch) |
| 04 Transaction + receipt | `16:266` | **Yes** |
| Components (QuickAction, Chip, TabBar, Icons) | `15:15` | Reuse |

The Figma file has no account transaction list. The list follows the "Account detail" pattern in
[features.md](features.md#screens-today): transactions grouped by day.

## Data we have

All in `services/api/app/data/`:

- `transactions.json` holds 529 transactions for 2025, `account` `privat` or `kk`, `type` `expense`,
  `income` or `transfer`, amounts as integer Rappen (`amount_rp`).
- `receipts/*.json` holds 5 supermarket receipts from November 2025. Each item has `category`,
  `quantity`, `unit_price_rp`, `line_total_rp` and `vat_rate_pct`.
- Two item fields are optional. `discount_rp` is a discount that is subtracted from
  `line_total_rp`. `unit: "kg"` marks a weighed item with a decimal `quantity`, for example
  `0.714 × 219 = 156`. The Lidl 20.11 receipt (from `Lidl Plus.pdf`) has 7 discounts and 3 weighed
  items. A receipt total is the sum of `line_total_rp − discount_rp`: without the discounts, Lidl
  20.11 adds up to 85.88 instead of 84.44.
- Matching receipt to transaction is by date plus `total_rp == amount_rp`, with the store name
  contained in `counterparty`. Coop 19.11 → K-0241, Migros 14.11 → P-0233, Lidl 20.11 → K-0242 and
  Lidl 21.11 → K-0247 match. Denner 20.11 has no transaction.
- Five receipts are too few for trends, so the backend generates more fake receipts (task BE-2).

## API contract (frontend and backend build against this)

Amounts are always integer Rappen (`*_rp`), positive numbers; `type` gives the sign.
The frontend formats them with `Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' })`.

### `GET /api/transactions?account=privat|kk`

Newest first. `account` is optional (both accounts if missing).

```jsonc
[
  {
    "id": "K-0241",
    "account": "kk",
    "date": "2025-11-19",
    "type": "expense",                      // expense | income | transfer
    "description": "Coop Luzern Bahnhof 2025-11-19",
    "counterparty": "Coop Luzern Bahnhof",
    "amount_rp": 11970,
    "currency": "CHF",
    "original_amount": null,                // set for foreign currency, e.g. 46.97
    "original_currency": null,              // e.g. "EUR"
    "has_receipt": true
  }
]
```

### `GET /api/transactions/{id}`

The same fields plus `receipt` (or `null`). 404 if the id is unknown.

```jsonc
{
  "id": "K-0241",
  "...": "all list fields",
  "receipt": {
    "receipt_id": "COOP-20251119-2281",
    "store": "Coop",
    "branch": "Luzern Bahnhof",
    "time": "18:15",
    "source": "store_app",                  // store_app | photo
    "total_rp": 11970,
    "items": [
      { "name": "Feldschlösschen Original 10x50cl", "category": "alcohol",
        "quantity": 1, "unit_price_rp": 1295, "line_total_rp": 1295 },
      // item shape from the Lidl 20.11 receipt, to show the optional fields
      { "name": "Apfel rot lose", "category": "fruit",
        "quantity": 0.714, "unit": "kg",          // optional, weighed items only
        "unit_price_rp": 219, "line_total_rp": 156,
        "discount_rp": 17 }                       // optional, subtract from line_total_rp
    ],
    "category_totals": [ { "category": "alcohol", "total_rp": 11165 } ]  // net: line_total_rp − discount_rp
  }
}
```

### `GET /api/spending/categories?month=2025-11`

Item-level spending of one month per category, compared with the average of the other months.
It feeds the insight line on the receipt screen ("chocolate this month is CHF 38.60, about twice
your usual") and the chat.

```jsonc
{
  "month": "2025-11",
  "categories": [
    { "category": "chocolate", "total_rp": 3860, "average_rp": 1930, "ratio": 2.0 }
  ]
}
```

### `POST /api/chat` (exists, shape unchanged)

```jsonc
// request
{ "messages": [{ "role": "user", "content": "Where can I save?" }], "language": "en" }
// response
{ "reply": "..." }
```

The backend adds the user's spending context to the system prompt, so the frontend only sends the
conversation.

Item categories (fixed list): `dairy`, `bakery`, `fruit`, `vegetables`, `meat_fish`, `eggs`,
`pasta`, `frozen`, `spreads`, `snacks`, `chocolate`, `beverages`, `coffee`, `alcohol`, `household`,
`personal_care`.

## Task split

Each task is one small PR. Backend tasks are independent of frontend tasks: the frontend uses
fixtures that follow the contract above until the real endpoint is merged.

### Backend

| # | Task | Done when |
|---|------|-----------|
| BE-1 | Transactions module: load `transactions.json` and receipts, match receipts to transactions, `GET /api/transactions` and `GET /api/transactions/{id}` | Both endpoints return the contract shape; tests cover match, no match, unknown id, account filter |
| BE-2 | Fake receipts: a deterministic generator script that writes a receipt for every 2025 supermarket transaction (Coop, Migros, Lidl, Denner; add a few more grocery transactions if a month has none) and for some of the Kantine lunches, with items from the fixed categories whose `line_total_rp` sum equals `amount_rp`. Fix Denner 20.11 (add its transaction or drop it). Build in a believable story: chocolate and alcohol rise in November | Every supermarket transaction has a receipt; a test checks that every receipt total equals its transaction amount |
| BE-3 | `GET /api/spending/categories?month=YYYY-MM` | Totals, average and ratio per category; tests with a small fixture |
| BE-4 | Grounded chat: `chat.py` adds a compact spending summary (monthly income and expenses, category totals per month, top merchants) and the Psst persona to the system prompt. Psst only reads, never moves money, speaks plainly, and talks about alcohol only when asked or with an opt-in question, never judging | Tests with the fake LLM check that the summary is in the system prompt; a manual question "Where can I save?" gives an answer with real numbers |
| BE-5 (stretch) | `explanation` field on `GET /api/transactions/{id}`: one plain-language sentence ("Groceries at a supermarket in Bern, paid with your card") | Field present; LLM call cached per id or rule-based |

### Frontend

| # | Task | Done when |
|---|------|-----------|
| FE-1 | Mobile app shell in the PostFinance look: light mint-grey background, white rounded cards, dark petrol text, yellow accent, bottom tab bar (Home, Payments, Invest, Offers, Services), content max 390 px wide and centred. Rename the UI from "Beyond the List" to Psst | Home renders in the shell; axe passes |
| FE-2 | Account transaction list `/accounts/:account`: grouped by day, merchant, amount, receipt icon when `has_receipt` | Tapping a row opens the transaction screen |
| FE-3 | Transaction + receipt screen `/transactions/:id` (Figma 04): amount, raw bank text, "Psst explains", receipt items with prices and total, Psst insight with a chip that opens the chat, "Add receipt photo" button (no function in MVP) | Matches Figma; works with and without a receipt |
| FE-4 | Psst chat screen `/psst` (Figma 02): header "Just between us · reads only, never pays", message bubbles, suggestion chips, input with send button, multi-turn conversation over `POST /api/chat` | A conversation of several turns works; loading and error states; RTL for Arabic |
| FE-5 | Home entry points (Figma 01): Psst quick action and Psst card with chips open the chat; account rows open the list | All entry points navigate correctly |

Suggested order: backend BE-1 → BE-2 → BE-4 → BE-3; frontend FE-1 → FE-3 → FE-4 → FE-2 → FE-5.
The demo story: open a Coop transaction, see the receipt with alcohol and chocolate, tap the
insight chip, ask Psst "Where can I save?" and get an answer with real numbers.

## Prompts for a fresh Claude Code session

Copy one prompt into a new session in this repo. Replace `<task>` with the task number.

### Frontend

```text
Read CLAUDE.md, docs/mvp.md, docs/features.md and docs/stack.md first.
We are team Call me Susan building Psst, an AI assistant inside the PostFinance banking app,
for the "Beyond the List" hackathon challenge. I work on the frontend (apps/web: React, Vite,
TypeScript, Tailwind v4, shadcn/ui, i18next with en/de/uk/ru/ar and RTL for Arabic, Vitest,
axe-core). A teammate builds the backend in parallel.

Task: <task> from the frontend table in docs/mvp.md.

Rules:
- git checkout main && git pull origin main, then create a feature/... branch. Never work on main.
- The design source is the Figma file in docs/mvp.md (file key oOu7PPG4eIaWZPFVOELCCI, page
  "Psst MVP"). Read the frame for this task with the figma MCP server (get_design_context with the
  node id from docs/mvp.md) and adapt it to our components and Tailwind tokens. Do not copy
  absolute positions; build a responsive mobile layout (390 px design width, works on 320 px).
- Build against the API contract in docs/mvp.md. If the endpoint is not merged yet, use a typed
  fixture in the feature folder that follows the contract exactly; keep fetch calls relative
  (/api/...).
- Amounts are integer Rappen; format with Intl.NumberFormat('de-CH', currency CHF).
- Every user-visible string goes through i18next in all five locales.
- Accessibility: semantic HTML, labels, focus states, an axe test for each new screen.
- Tests for logic (formatting, grouping, chat state) with Vitest. Run scripts/validate.sh.
- Small PR with a Conventional Commit title. Do not create GitHub issues or labels unless I ask.
```

### Backend

```text
Read CLAUDE.md, docs/mvp.md and docs/stack.md first.
We are team Call me Susan building Psst, an AI assistant inside the PostFinance banking app,
for the "Beyond the List" hackathon challenge. I work on the backend (services/api: Python 3.12,
FastAPI, uv, pytest, ruff; LLM via OpenRouter through app/llm.py and the get_llm dependency).
A teammate builds the frontend in parallel against the API contract in docs/mvp.md.

Task: <task> from the backend table in docs/mvp.md.

Rules:
- git checkout main && git pull origin main, then create a feature/... branch. Never work on main.
- The API contract in docs/mvp.md is binding: same paths, field names and types. If a change is
  needed, update docs/mvp.md in the same PR and say so in the PR description.
- Data lives in services/api/app/data/ (transactions.json, receipts/*.json). Amounts are integer
  Rappen. Fake data must be deterministic (fixed seed) and committed as JSON.
- Test first (test-driven-development skill): failing test, minimal code, refactor. Tests never
  call the real LLM: override get_llm with a fake.
- Keep routes thin in app/main.py; logic in its own module (for example app/transactions.py,
  app/spending.py).
- Never print or commit secrets from .env.
- Run scripts/validate.sh. Small PR with a Conventional Commit title. Do not create GitHub
  issues or labels unless I ask.
```
