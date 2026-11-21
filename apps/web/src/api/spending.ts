import { getJson } from './client'
import type { SpendingByCategory, SpendingSummary } from './types'

// GET /api/spending/categories is not merged yet (BE-3). Placeholder values: the five November
// receipts give no history for an average, so these follow the example in docs/mvp.md until the
// backend (and the BE-2 receipts) exist. Replace the body of getSpendingByCategory() with
// getJson<SpendingByCategory>(`/api/spending/categories?month=${month}`).
const FIXTURE: Omit<SpendingByCategory, 'month'> = {
  categories: [
    { category: 'chocolate', total_rp: 3860, average_rp: 1930, ratio: 2.0 },
    { category: 'alcohol', total_rp: 14300, average_rp: 11000, ratio: 1.3 },
    { category: 'snacks', total_rp: 1520, average_rp: 1270, ratio: 1.2 },
    { category: 'bakery', total_rp: 2140, average_rp: 2300, ratio: 0.93 },
  ],
}

export async function getSpendingByCategory(month: string): Promise<SpendingByCategory> {
  return { month, ...FIXTURE }
}

export async function getSpendingSummary(year?: number): Promise<SpendingSummary> {
  return getJson<SpendingSummary>(year ? `/api/spending/summary?year=${year}` : '/api/spending/summary')
}
