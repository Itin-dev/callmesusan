import { getJson } from './client'
import type { Transaction, TransactionAccount, TransactionDetail } from './types'

const TRANSACTION_ACCOUNTS: readonly string[] = ['privat', 'kk'] satisfies TransactionAccount[]

/**
 * GET /api/transactions?account=: newest first. Only privat and kk have transactions (the API
 * answers 422 for other ids), so savings and 3rd pillar get an empty list without a request.
 */
export async function getAccountTransactions(account: string): Promise<Transaction[]> {
  if (!TRANSACTION_ACCOUNTS.includes(account)) return []
  return getJson<Transaction[]>(`/api/transactions?account=${encodeURIComponent(account)}`)
}

/** GET /api/transactions/{id}: the transaction with its receipt (or null). 404 → ApiError. */
export function getTransaction(id: string): Promise<TransactionDetail> {
  return getJson<TransactionDetail>(`/api/transactions/${encodeURIComponent(id)}`)
}
