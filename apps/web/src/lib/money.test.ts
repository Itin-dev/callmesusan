import { describe, expect, it } from 'vitest'
import { formatAmount, formatChf, formatChfWhole, formatSignedAmount } from './money'

const NBSP = ' '

describe('formatChf', () => {
  it('formats Rappen as Swiss francs', () => {
    expect(formatChf(481235)).toBe(`CHF${NBSP}4'812.35`)
  })

  it('adds a trailing plus for credits (PostFinance style)', () => {
    expect(formatChf(2348000, 'credit')).toBe(`CHF${NBSP}23'480.00+`)
  })

  it('adds a trailing minus for debits', () => {
    expect(formatChf(4780, 'debit')).toBe(`CHF${NBSP}47.80–`)
  })

  it('uses an ASCII apostrophe as thousands separator in every browser', () => {
    expect(formatChf(100000000)).toBe(`CHF${NBSP}1'000'000.00`)
  })

  it('formats zero and small amounts', () => {
    expect(formatChf(0)).toBe(`CHF${NBSP}0.00`)
    expect(formatChf(5)).toBe(`CHF${NBSP}0.05`)
  })
})

describe('formatAmount', () => {
  it('formats Rappen without the currency, as on a receipt line', () => {
    expect(formatAmount(1295)).toBe('12.95')
    expect(formatAmount(180)).toBe('1.80')
  })

  it('uses an ASCII apostrophe as thousands separator', () => {
    expect(formatAmount(123450)).toBe("1'234.50")
  })
})

describe('formatSignedAmount', () => {
  it('formats a list amount without the currency and with a trailing sign', () => {
    expect(formatSignedAmount(6435, 'debit')).toBe('64.35–')
    expect(formatSignedAmount(123450, 'credit')).toBe("1'234.50+")
  })
})

describe('formatChfWhole', () => {
  it('rounds to whole francs for summaries', () => {
    expect(formatChfWhole(8897751)).toBe(`CHF${NBSP}88'978`)
    expect(formatChfWhole(741479)).toBe(`CHF${NBSP}7'415`)
  })
})
