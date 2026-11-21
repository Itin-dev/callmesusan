import { ApiError } from './client'
import { TRANSACTION_FIXTURES } from './transactions.fixtures'
import type { TransactionDetail } from './types'

// GET /api/transactions/{id} is not merged yet (BE-1). Replace the body of getTransaction() with
// getJson<TransactionDetail>(`/api/transactions/${id}`) and delete transactions.fixtures.ts.
export async function getTransaction(id: string): Promise<TransactionDetail> {
  const transaction = TRANSACTION_FIXTURES[id]
  if (!transaction) throw new ApiError('Transaction not found', 404)
  return transaction
}
