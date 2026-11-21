import type { AccountsOverview } from './types'

// No accounts endpoint exists yet (docs/mvp.md). This fixture mirrors Figma "01 Home"; replace the
// body of getAccounts() with getJson<AccountsOverview>('/api/accounts') once the backend has it.
const FIXTURE: AccountsOverview = {
  accounts: [
    { id: 'privat', kind: 'private', iban_masked: 'CH•• •••• •••• 4821', balance_rp: 481235 },
    { id: 'savings', kind: 'savings', iban_masked: 'CH•• •••• •••• 7390', balance_rp: 1200000 },
    { id: 'pillar3', kind: 'pillar3', iban_masked: null, balance_rp: 666765 },
  ],
  total_rp: 2348000,
}

export async function getAccounts(): Promise<AccountsOverview> {
  return FIXTURE
}
