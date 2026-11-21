import { describe, expect, it } from 'vitest'
import type { Transaction } from '@/api/types'
import { formatDay, groupByDay, localIsoDate, merchantInitials, receiptBadge } from './transactionDisplay'

const tx = (id: string, date: string, extra: Partial<Transaction> = {}): Transaction => ({
  id,
  account: 'kk',
  date,
  type: 'expense',
  description: `Shop ${date}`,
  counterparty: 'Shop',
  amount_rp: 1000,
  currency: 'CHF',
  original_amount: null,
  original_currency: null,
  has_receipt: false,
  ...extra,
})

describe('groupByDay', () => {
  it('groups by day, newest day first, keeping the order inside a day', () => {
    const groups = groupByDay([tx('a', '2025-11-19'), tx('b', '2025-11-20'), tx('c', '2025-11-20'), tx('d', '2025-11-21')])
    expect(groups.map((g) => g.date)).toEqual(['2025-11-21', '2025-11-20', '2025-11-19'])
    expect(groups[1].transactions.map((t) => t.id)).toEqual(['b', 'c'])
  })

  it('returns no groups for no transactions', () => {
    expect(groupByDay([])).toEqual([])
  })
})

describe('formatDay', () => {
  it('says Today and Yesterday relative to today, then dd.mm.yyyy', () => {
    expect(formatDay('2025-11-21', '2025-11-21')).toBe('today')
    expect(formatDay('2025-11-20', '2025-11-21')).toBe('yesterday')
    expect(formatDay('2025-11-19', '2025-11-21')).toBe('19.11.2025')
  })

  it('knows yesterday across month and year boundaries', () => {
    expect(formatDay('2025-02-28', '2025-03-01')).toBe('yesterday')
    expect(formatDay('2025-12-31', '2026-01-01')).toBe('yesterday')
  })
})

describe('localIsoDate', () => {
  it('formats a local date as YYYY-MM-DD', () => {
    expect(localIsoDate(new Date(2026, 10, 1, 23, 30))).toBe('2026-11-01')
  })
})

describe('merchantInitials', () => {
  it('takes the first two letters of the counterparty', () => {
    expect(merchantInitials('Coop Luzern Bahnhof')).toBe('CO')
    expect(merchantInitials('iTunes.com')).toBe('IT')
    expect(merchantInitials('SBB CFF FSS Ticket Shop')).toBe('SB')
  })

  it('skips leading non-letters and handles empty names', () => {
    expect(merchantInitials('7-Eleven')).toBe('EL')
    expect(merchantInitials('')).toBe('')
  })
})

describe('receiptBadge', () => {
  it('follows receipt_status from the backend', () => {
    expect(receiptBadge(tx('a', '2025-11-20', { receipt_status: 'attached', has_receipt: true }))).toBe('receipt')
    expect(receiptBadge(tx('a', '2025-11-20', { receipt_status: 'missing' }))).toBe('add')
    expect(receiptBadge(tx('a', '2025-11-20', { receipt_status: 'none' }))).toBeNull()
  })

  it('falls back to has_receipt while the backend has no receipt_status', () => {
    expect(receiptBadge(tx('a', '2025-11-20', { has_receipt: true }))).toBe('receipt')
    expect(receiptBadge(tx('a', '2025-11-20'))).toBeNull()
  })

  it('shows Receipt for a payment with a scanned receipt, whatever the backend says', () => {
    expect(receiptBadge(tx('a', '2025-11-20'), true)).toBe('receipt')
    expect(receiptBadge(tx('a', '2025-11-20', { receipt_status: 'missing' }), true)).toBe('receipt')
  })
})
