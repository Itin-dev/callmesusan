import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockApi } from '@/test-utils'
import { ApiError } from './client'
import { SUMMARY_FIXTURE } from './spending.fixtures'
import { getSpendingSummary } from './spending'

afterEach(() => vi.unstubAllGlobals())

describe('getSpendingSummary', () => {
  it('asks the API for the latest year when no year is given', async () => {
    const fetch = mockApi()
    expect(await getSpendingSummary()).toEqual(SUMMARY_FIXTURE)
    expect(fetch).toHaveBeenCalledWith('/api/spending/summary', expect.anything())
  })

  it('asks the API for the given year', async () => {
    const fetch = mockApi()
    await getSpendingSummary(2025)
    expect(fetch).toHaveBeenCalledWith('/api/spending/summary?year=2025', expect.anything())
  })

  it('passes an API error on', async () => {
    mockApi({ summary: Response.json({ detail: 'no data for 1999' }, { status: 404 }) })
    await expect(getSpendingSummary(1999)).rejects.toEqual(new ApiError('no data for 1999', 404))
  })
})
