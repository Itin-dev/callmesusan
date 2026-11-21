import { describe, expect, it } from 'vitest'
import { ApiError } from './client'
import { getTransaction } from './transactions'

describe('getTransaction', () => {
  it('returns the Coop transaction with its store-app receipt', async () => {
    const tx = await getTransaction('K-0241')
    expect(tx).toMatchObject({ id: 'K-0241', account: 'kk', type: 'expense', amount_rp: 11970, has_receipt: true })
    expect(tx.receipt?.source).toBe('store_app')
    expect(tx.receipt?.items).toHaveLength(8)
  })

  it.each(['K-0241', 'K-0242'])('%s has a receipt whose net items and category totals add up to the amount', async (id) => {
    const tx = await getTransaction(id)
    const receipt = tx.receipt!
    const sum = (values: number[]) => values.reduce((a, b) => a + b, 0)
    expect(receipt.total_rp).toBe(tx.amount_rp)
    expect(sum(receipt.items.map((i) => i.line_total_rp - (i.discount_rp ?? 0)))).toBe(receipt.total_rp)
    expect(sum(receipt.category_totals.map((c) => c.total_rp))).toBe(receipt.total_rp)
  })

  it('returns the Lidl receipt with weighed items and discounts', async () => {
    const tx = await getTransaction('K-0242')
    const apples = tx.receipt?.items.find((i) => i.name === 'Apfel rot lose')
    expect(apples).toMatchObject({ quantity: 0.714, unit: 'kg', line_total_rp: 156, discount_rp: 17 })
  })

  it('returns a transaction without a receipt', async () => {
    const tx = await getTransaction('K-0240')
    expect(tx).toMatchObject({ id: 'K-0240', has_receipt: false, receipt: null })
  })

  it('rejects an unknown id with a 404 ApiError, like the endpoint', async () => {
    const error = await getTransaction('X-9999').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(404)
  })
})
