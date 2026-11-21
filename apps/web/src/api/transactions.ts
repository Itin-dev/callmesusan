import { getJson } from './client'
import type { TransactionDetail } from './types'

/** GET /api/transactions/{id}: the transaction with its receipt (or null). 404 → ApiError. */
export function getTransaction(id: string): Promise<TransactionDetail> {
  return getJson<TransactionDetail>(`/api/transactions/${encodeURIComponent(id)}`)
}
