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

| # | Feature | Example question | Effort | Data needed / notes |
|---|---------|------------------|--------|---------------------|
| 1 | Spending check by category | "Am I spending too much on chocolate?" | M | Item-level data from receipts (the CSV has transactions only) |
| 2 | Statement on request | "Make me a statement for November." | S | Transactions CSV to summary or PDF |
| 3 | Year-end tax estimate | "How much tax will I pay in total at the end of the year?" | L | Income from transactions and a rough Bern tax rate; shown clearly as an estimate |
| 4 | Tax savings plan with memory | "Help me put money aside for taxes every month." | L | Keeps the plan, reminds in chat how much is still due this month, adds a missed month to the next one. Suggests a transfer, never moves money without confirmation |
| 5 | Can I afford it? (savings goal) | "I want to go on holiday in April. Can I afford it, and how much should I save each month?" | M | Average monthly income and expenses |
| 6 | Where can I cut costs? | "Where can I cut my expenses?" | M | Category totals compared with the monthly average |
| 7 | Payday reminder | "Remind me to save after every payday." | M | Detect the salary transaction |
| 8 | Mortgage down payment goal | "Where can I save to reach the down payment for a mortgage?" | M | Savings goal and cost-cutting tips |
| 9 | Subscription finder | "Which subscriptions am I paying for?" | S | Already in PostFinance Analysis ("My subscriptions"); Psst can only explain it |
| 10 | Unusual spending alert | "Anything unusual this month?" | M | Compare each category with its monthly average |
| 11 | Upcoming bills | "Will I have enough for rent and health insurance next month?" | M | Recurring fixed costs and their dates |
| 12 | End-of-month balance forecast | "What will my balance be at the end of the month?" | M | Current balance, expected income and fixed costs |
| 13 | Explain a transaction | "What is this TWINT payment of CHF 47.80?" | S | Merchant text from the transaction |
| 14 | Monthly recap | "Sum up my November in five sentences." | S | Transactions of one month |
| 15 | Any language + plain language | Ask in German, English, French, Ukrainian, Arabic… and get answers in simple words | S | The LLM handles it; strong "AI for Access" angle |
| 16 | Voice input | Ask by voice instead of typing | M | Browser speech-to-text |
| 17 | Trust panel | "What can you see, and what can you do?" | S | Read-only by default; every action needs confirmation. Supports the main pitch argument |
| 18 | Utility bills import | Add utility payments from a contract or the flat address | L | Not in the hackathon data; vision slide |
| 19 | Tax declaration help | Pre-fill the tax declaration from my data | L | Legal limits for a bank; vision slide |
| 20 | Business: VAT reserve | "How much VAT should I set aside this quarter?" | M | The challenge also mentions businesses |

## Where Psst fits in the PostFinance mobile app

Sources: team screenshots of the PostFinance App on iOS and Android (November 2026, no personal
data kept), the App Store listing and the public
[e-finance demo](https://www.postfinance.ch/demoefinloginen) (test client "Maria Bernasconi").
iOS and Android share the same layout.

### Screens today

| Screen | What is on it |
|--------|---------------|
| Login | "Good morning" greeting, city illustration, yellow Face ID login button, Scan and Contact and support below |
| Home | Search pill top right. Quick-access row of round icons: **Scan** (yellow, primary), Pay, Transfer, Analysis. "Accounts and Investments" cards (private, salary, savings, asset management, pillar 3a), "Other products" (credit card), "Add product" |
| Account detail | Balance history as a bar chart. Action row: **Payments** (yellow), Search, Details. "Show pending orders". Transactions grouped by day with merchant logos; the text is raw bank wording in German, e.g. "Kauf/Dienstleistung vom 20.11.2026, <merchant>" |
| Analytics | Back, filter icon, "Summarised" dropdown. Donut chart: income (outer ring) vs. expenditures (inner ring), period and average per month in the centre. Action row: Search, CO2 footprint. Income and Expenditures rows with transaction counts. "No active budgets", "My subscriptions" (recurring transactions), Transfers |
| Payments | Action row: Scan, Pay, Transfer, Settings. eBill list with due dates and the eBill portal. Pending individual orders. Standing orders with next execution date |
| Invest | Total of investments and retirement. Action row: Discover, Market overview, Consultation. Asset management and pillar 3a cards |
| Offers | "Add products" grid: credit cards, investing, retirement planning, accounts, multibanking, financing. Vouchers to buy and send as gifts |
| Services | Cards, Notifications, Documents, Profile and settings, Contact and support, Logout. The FAQ chatbot sits behind support, far from the client's money |

Bottom tab bar on every main screen: Home, Payments, Invest, Offers, Services.

### Design patterns to reuse

- Round icon buttons in a row, one yellow primary action, labels under the icons.
- Light mint-grey background, white rounded cards, dark petrol text, yellow accent.
- Search pill in the top right of every main screen.

### Gaps Psst can fill

- The donut shows that money went out, but not why or what to change.
- Transaction texts are raw German bank wording; there is no receipt and no plain explanation.
- eBills and standing orders show what is due, but not whether the balance covers it.
- Budgets exist but are empty for most users ("No active budgets"): setting them up is work.

### Entry points for Psst

1. **Home quick-access row:** Scan · Pay · Transfer · Analysis · **Psst**. Same round-icon pattern,
   no new tab needed.
2. **Card at the top of Home:** "Psst… ask me about your money" with 2–3 suggested questions.
3. **Analytics action row:** Search · CO2 footprint · **Ask Psst** ("Why did I spend more than I
   earned?"). Psst can also offer to set up budgets from the spending it sees.
4. **Account detail and transaction row:** the receipt (must-have) and a plain-language
   explanation of the raw bank text, in the user's language.
5. **Payments, next to eBills:** "Can I pay all of these before the end of the month?"
6. **Push after payday:** "Psst, your salary is in. Put some aside for taxes?" opens the chat.
7. **Search pill:** accepts plain-language questions on every main screen.

Demo priority: 1, 2, 3 and 4 live; 5 and 6 on a slide.
