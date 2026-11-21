import { describe, expect, it } from 'vitest'
import { pickInsight } from './insight'
import type { Receipt, SpendingByCategory } from './types'

const receipt = {
  category_totals: [
    { category: 'alcohol', total_rp: 11165 },
    { category: 'chocolate', total_rp: 180 },
    { category: 'snacks', total_rp: 230 },
  ],
} as Receipt

function spending(categories: SpendingByCategory['categories']): SpendingByCategory {
  return { month: '2025-11', categories }
}

describe('pickInsight', () => {
  it('picks the receipt category with the highest ratio to the usual month', () => {
    const result = pickInsight(
      receipt,
      spending([
        { category: 'snacks', total_rp: 900, average_rp: 500, ratio: 1.8 },
        { category: 'chocolate', total_rp: 3860, average_rp: 1930, ratio: 2.0 },
      ]),
    )
    expect(result).toEqual({ category: 'chocolate', total_rp: 3860, average_rp: 1930, ratio: 2.0 })
  })

  it('ignores categories that are not on this receipt', () => {
    const result = pickInsight(receipt, spending([{ category: 'coffee', total_rp: 9000, average_rp: 1000, ratio: 9 }]))
    expect(result).toBeNull()
  })

  it('ignores categories close to the usual (ratio below 1.5)', () => {
    const result = pickInsight(receipt, spending([{ category: 'snacks', total_rp: 600, average_rp: 500, ratio: 1.2 }]))
    expect(result).toBeNull()
  })

  it('returns null without spending data', () => {
    expect(pickInsight(receipt, undefined)).toBeNull()
  })
})
