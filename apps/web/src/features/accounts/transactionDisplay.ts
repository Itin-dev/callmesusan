import type { Transaction } from '@/api/types'

// Display formatting for the account transaction list. No business logic: receipt status,
// totals and matching come from the backend; this only groups, labels and abbreviates.

export type DayGroup = { date: string; transactions: Transaction[] }

/** Group transactions by booking day, newest day first; the order inside a day is kept. */
export function groupByDay(transactions: Transaction[]): DayGroup[] {
  const byDate = new Map<string, Transaction[]>()
  for (const transaction of transactions) {
    const day = byDate.get(transaction.date)
    if (day) day.push(transaction)
    else byDate.set(transaction.date, [transaction])
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({ date, transactions: items }))
}

const dateFormat = new Intl.DateTimeFormat('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
const DAY_MS = 24 * 60 * 60 * 1000
const utc = (isoDate: string) => Date.parse(`${isoDate}T00:00:00Z`)

/** Day heading: "today", "yesterday" (translated by the caller) or the date as dd.mm.yyyy. */
export function formatDay(date: string, today: string): 'today' | 'yesterday' | string {
  const daysAgo = Math.round((utc(today) - utc(date)) / DAY_MS)
  if (daysAgo === 0) return 'today'
  if (daysAgo === 1) return 'yesterday'
  return dateFormat.format(utc(date))
}

/** The device's local date as YYYY-MM-DD, to compare with transaction dates. */
export function localIsoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Two letters for the round merchant logo, e.g. "Coop Luzern Bahnhof" → "CO". */
export function merchantInitials(counterparty: string): string {
  return (counterparty.match(/\p{L}/gu) ?? []).slice(0, 2).join('').toUpperCase()
}

/** Row badge: "Receipt" when attached, "+ Add receipt" when the backend says one is missing. */
export function receiptBadge(transaction: Transaction): 'receipt' | 'add' | null {
  const status = transaction.receipt_status ?? (transaction.has_receipt ? 'attached' : 'none')
  if (status === 'attached') return 'receipt'
  if (status === 'missing') return 'add'
  return null
}
