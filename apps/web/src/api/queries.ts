import { useQuery } from '@tanstack/react-query'
import { getAccounts } from './accounts'
import { ApiError } from './client'
import { pickInsight } from './insight'
import { getSpendingByCategory } from './spending'
import { getTransaction } from './transactions'
import type { TransactionDetail } from './types'

/** React Query hooks: screens read server data only through these. */
export function useAccounts() {
  return useQuery({ queryKey: ['accounts'], queryFn: getAccounts })
}

export const isNotFound = (error: unknown) => error instanceof ApiError && error.status === 404

export function useTransaction(id: string) {
  return useQuery({
    queryKey: ['transaction', id],
    queryFn: () => getTransaction(id),
    // An unknown id stays unknown: do not retry a 404.
    retry: (failureCount, error) => !isNotFound(error) && failureCount < 1,
  })
}

/** Insight for a receipt: the receipt category most above its usual month (null when none). */
export function useReceiptInsight(transaction: TransactionDetail | undefined) {
  const receipt = transaction?.receipt
  const month = transaction?.date.slice(0, 7) ?? ''
  return useQuery({
    queryKey: ['spending', 'categories', month],
    queryFn: () => getSpendingByCategory(month),
    enabled: Boolean(receipt),
    select: (spending) => (receipt ? pickInsight(receipt, spending) : null),
  })
}
