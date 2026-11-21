import { useMutation, useQuery } from '@tanstack/react-query'
import { getAccounts } from './accounts'
import { ApiError } from './client'
import { pickInsight } from './insight'
import { scanReceipt } from './receipts'
import { getSpendingByCategory, getSpendingSummary } from './spending'
import { getAccountTransactions, getTransaction } from './transactions'
import { downscaleImage } from '@/lib/image'
import type { TransactionDetail } from './types'

/** React Query hooks: screens read server data only through these. */
export function useAccounts() {
  return useQuery({ queryKey: ['accounts'], queryFn: getAccounts })
}

/** Transactions of one account, newest first (empty for accounts without transactions). */
export function useAccountTransactions(account: string) {
  return useQuery({ queryKey: ['transactions', account], queryFn: () => getAccountTransactions(account) })
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

/** Income vs expenses for Analytics: the given year, or the latest one the backend has. */
export function useSpendingSummary(year?: number) {
  return useQuery({ queryKey: ['spending', 'summary', year], queryFn: () => getSpendingSummary(year) })
}

/** Scan a receipt photo: scaled down in the browser, then read and matched by the backend. */
export function useScanReceipt() {
  return useMutation({ mutationFn: async (photo: Blob) => scanReceipt(await downscaleImage(photo)) })
}
