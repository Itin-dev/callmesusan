import type { SpendingSummary } from './types'

/** GET /api/spending/summary for 2025 (the latest year in transactions.json), as the backend answers it. */
export const SUMMARY_FIXTURE: SpendingSummary = {
  period_start: '2025-01-01',
  period_end: '2025-12-31',
  income: { total_rp: 9703200, count: 13, monthly_average_rp: 808600 },
  expenses: { total_rp: 8897751, count: 461, monthly_average_rp: 741479 },
}
