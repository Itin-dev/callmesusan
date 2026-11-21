import { getJson } from './client'
import type { SpendingByCategory, SpendingSummary } from './types'

export async function getSpendingByCategory(month: string): Promise<SpendingByCategory> {
  return getJson<SpendingByCategory>(`/api/spending/categories?month=${month}`)
}

export async function getSpendingSummary(year?: number): Promise<SpendingSummary> {
  return getJson<SpendingSummary>(year ? `/api/spending/summary?year=${year}` : '/api/spending/summary')
}
