# Psst — feature ideas

Candidate features for **Psst**, the AI assistant inside the bank app. The team rates them in the
shared sheet [Psst — feature ideas to rate](https://claude.ai/artifact/QVdXSqaZrsTorewvUtz2jV)
(one 1–5 vote per role); this file is the snapshot of the list. Effort is a first estimate.

The demo shows one or two working features end to end. The rest goes on a "What's next" slide.

## Must-have

| Feature | Example | Effort | Notes |
|---------|---------|--------|-------|
| Detailed receipt per transaction | Tap a transaction and see the full receipt: every item and its price. Pulled from a retailer app (Lidl Plus type) or from a photo of the paper receipt | M | Demo: mock retailer-app receipts linked to CSV transactions by date, amount and merchant, plus photo upload read by a vision model. Unlocks #1 and item-level advice |

## Candidates

| # | Feature | Example question | Effort | Idea by | Data needed / notes |
|---|---------|------------------|--------|---------|---------------------|
| 1 | Spending check by category | "Am I spending too much on chocolate?" | M | Liuba | Item-level data from receipts (the CSV has transactions only) |
| 2 | Statement on request | "Make me a statement for November." | S | Liuba | Transactions CSV to summary or PDF |
| 3 | Year-end tax estimate | "How much tax will I pay in total at the end of the year?" | L | Liuba | Income from transactions and a rough Bern tax rate; shown clearly as an estimate |
| 4 | Tax savings plan with memory | "Help me put money aside for taxes every month." | L | Liuba | Keeps the plan, reminds in chat how much is still due this month, adds a missed month to the next one. Suggests a transfer, never moves money without confirmation |
| 5 | Can I afford it? (savings goal) | "I want to go on holiday in April. Can I afford it, and how much should I save each month?" | M | Liuba | Average monthly income and expenses |
| 6 | Where can I cut costs? | "Where can I cut my expenses?" | M | Liuba | Category totals compared with the monthly average |
| 7 | Payday reminder | "Remind me to save after every payday." | M | Liuba | Detect the salary transaction |
| 8 | Mortgage down payment goal | "Where can I save to reach the down payment for a mortgage?" | M | Liuba | Savings goal and cost-cutting tips |
| 9 | Subscription finder | "Which subscriptions am I paying for?" | S | Claude | Already in PostFinance Analysis ("My subscriptions"); Psst can only explain it |
| 10 | Unusual spending alert | "Anything unusual this month?" | M | Claude | Compare each category with its monthly average |
| 11 | Upcoming bills | "Will I have enough for rent and health insurance next month?" | M | Claude | Recurring fixed costs and their dates |
| 12 | End-of-month balance forecast | "What will my balance be at the end of the month?" | M | Claude | Current balance, expected income and fixed costs |
| 13 | Explain a transaction | "What is this TWINT payment of CHF 47.80?" | S | Claude | Merchant text from the transaction |
| 14 | Monthly recap | "Sum up my November in five sentences." | S | Claude | Transactions of one month |
| 15 | Any language + plain language | Ask in German, English, French, Ukrainian, Arabic… and get answers in simple words | S | Liuba | The LLM handles it; strong "AI for Access" angle |
| 16 | Voice input | Ask by voice instead of typing | M | Liuba | Browser speech-to-text |
| 17 | Trust panel | "What can you see, and what can you do?" | S | Claude | Read-only by default; every action needs confirmation. Supports the main pitch argument |
| 18 | Utility bills import | Add utility payments from a contract or the flat address | L | Liuba | Not in the hackathon data; vision slide |
| 19 | Tax declaration help | Pre-fill the tax declaration from my data | L | Liuba | Legal limits for a bank; vision slide |
| 20 | Business: VAT reserve | "How much VAT should I set aside this quarter?" | M | Claude | The challenge also mentions businesses |

## Where Psst fits in the PostFinance mobile app

Sources: the PostFinance App listing in the App Store and the public
[e-finance demo](https://www.postfinance.ch/demoefinloginen) (test client "Maria Bernasconi").

**What the app has today**

- Five main areas: Home, Payments, Invest, Offers, Services. A quick-access row: Scan, Pay,
  Transfer, Analysis. Search on the main screens.
- Analysis: balance donut, incomings and expenses, monthly timeline, "My subscriptions", tags,
  budgets, CO2 calculator. No explanation of why the balance is negative.
- A chatbot under Services, next to support. It answers questions about the bank, not about the
  client's own money.
- Push notifications for credits, debits, eBills and documents.

**Entry points for Psst**

1. Fifth button in the quick-access row: Scan · Pay · Transfer · Analysis · Psst.
2. Card at the top of Home: "Psst… ask me about your money" with 2–3 suggested questions.
3. Contextual button in Analysis next to the balance: "Ask Psst why". The demo client spent
   CHF 6'648 more than she earned in 3 months, which makes a ready demo moment.
4. Transaction detail: the receipt (must-have) and "What is this payment?".
5. Push after payday: "Psst, your salary is in. Put 300 aside for taxes?" opens the chat.
6. Search on the main screens accepts plain-language questions.

Demo priority: 1, 2 and 3 live; 5 on a slide.
