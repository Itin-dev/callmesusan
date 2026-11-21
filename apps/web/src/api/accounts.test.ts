import { afterEach, describe, expect, it, vi } from 'vitest'
import { mockApi } from '@/test-utils'
import { ACCOUNTS_FIXTURE } from './accounts.fixtures'
import { getAccounts } from './accounts'

afterEach(() => vi.unstubAllGlobals())

describe('getAccounts', () => {
  it('loads the accounts from the API and adds the credit card until the backend serves it', async () => {
    const fetch = mockApi()
    const overview = await getAccounts()
    expect(fetch).toHaveBeenCalledWith('/api/accounts', expect.anything())
    expect(overview.accounts.map((a) => a.id)).toEqual(['privat', 'savings', 'pillar3', 'kk'])
    expect(overview.accounts.at(-1)?.kind).toBe('credit_card')
    expect(overview.total_rp).toBe(ACCOUNTS_FIXTURE.total_rp)
  })

  it('does not add the credit card twice once the backend serves it', async () => {
    const kk = { id: 'kk', kind: 'credit_card' as const, iban_masked: null, balance_rp: 1234 }
    mockApi({ accounts: { ...ACCOUNTS_FIXTURE, accounts: [...ACCOUNTS_FIXTURE.accounts, kk] } })
    const overview = await getAccounts()
    expect(overview.accounts.filter((a) => a.id === 'kk')).toEqual([kk])
  })
})
