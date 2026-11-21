import { describe, expect, it } from 'vitest'
import { formatChf } from './money'

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
