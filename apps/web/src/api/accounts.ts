import { getJson } from './client'
import type { Account, AccountsOverview } from './types'

// STOPGAP until GET /api/accounts serves the credit card: most receipts (e.g. Coop K-0241) are on
// `kk`, so Home needs a row for it. The balance is 0 because the last kk transaction in the demo
// data is the monthly card payment. total_rp stays the backend's value.
const CREDIT_CARD_FIXTURE: Account = { id: 'kk', kind: 'credit_card', iban_masked: null, balance_rp: 0 }

/** GET /api/accounts: the account rows of the Home screen. */
export async function getAccounts(): Promise<AccountsOverview> {
  const overview = await getJson<AccountsOverview>('/api/accounts')
  if (overview.accounts.some((account) => account.id === CREDIT_CARD_FIXTURE.id)) return overview
  return { ...overview, accounts: [...overview.accounts, CREDIT_CARD_FIXTURE] }
}
