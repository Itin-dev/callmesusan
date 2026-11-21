import type { SpendingByCategory, SpendingSummary } from './types'

/** GET /api/spending/summary for 2025 (the latest year in transactions.json), as the backend answers it. */
export const SUMMARY_FIXTURE: SpendingSummary = {
  period_start: '2025-01-01',
  period_end: '2025-12-31',
  income: { total_rp: 9703200, count: 13, monthly_average_rp: 808600 },
  expenses: { total_rp: 8897751, count: 461, monthly_average_rp: 741479 },
}

/** GET /api/spending/categories?month=2025-11, trimmed to the categories the screen tests use. */
export const CATEGORIES_FIXTURE: SpendingByCategory = {
  month: '2025-11',
  categories: [
    { category: 'chocolate', total_rp: 3860, average_rp: 1930, ratio: 2.0 },
    { category: 'alcohol', total_rp: 14300, average_rp: 11000, ratio: 1.3 },
    { category: 'snacks', total_rp: 1520, average_rp: 1270, ratio: 1.2 },
    { category: 'bakery', total_rp: 2140, average_rp: 2300, ratio: 0.93 },
  ],
}
