import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockApi } from '@/test-utils'
import { ApiError } from './client'
import { getAccountTransactions, getTransaction } from './transactions'
import { TRANSACTION_FIXTURES, TRANSACTION_LIST_FIXTURES } from './transactions.fixtures'

afterEach(() => vi.unstubAllGlobals())

describe('getTransaction', () => {
  it('loads the transaction with its receipt from the API', async () => {
    const fetch = mockApi()
    const tx = await getTransaction('K-0241')
    expect(fetch).toHaveBeenCalledWith('/api/transactions/K-0241', expect.anything())
    expect(tx).toEqual(TRANSACTION_FIXTURES['K-0241'])
  })

  it('escapes the id in the URL', async () => {
    const fetch = mockApi()
    await getTransaction('a/b').catch(() => undefined)
    expect(fetch).toHaveBeenCalledWith('/api/transactions/a%2Fb', expect.anything())
  })

  it('rejects an unknown id with a 404 ApiError', async () => {
    mockApi()
    const error = await getTransaction('X-9999').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(404)
  })
})

describe('getAccountTransactions', () => {
  it('loads the list of an account with transactions', async () => {
    const fetch = mockApi()
    const list = await getAccountTransactions('kk')
    expect(fetch).toHaveBeenCalledWith('/api/transactions?account=kk', expect.anything())
    expect(list).toEqual(TRANSACTION_LIST_FIXTURES.kk)
  })

  it('returns an empty list for accounts without transactions, without a request', async () => {
    const fetch = mockApi()
    expect(await getAccountTransactions('savings')).toEqual([])
    expect(await getAccountTransactions('pillar3')).toEqual([])
    expect(fetch).not.toHaveBeenCalled()
  })
})
