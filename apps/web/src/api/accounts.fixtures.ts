import type { AccountsOverview } from './types'

// Real GET /api/accounts response (services/api). It has no credit card yet: see accounts.ts.
export const ACCOUNTS_FIXTURE: AccountsOverview = {
  accounts: [
    { id: 'privat', kind: 'private', iban_masked: 'CH•• •••• •••• 4821', balance_rp: 481235 },
    { id: 'savings', kind: 'savings', iban_masked: 'CH•• •••• •••• 7390', balance_rp: 1200000 },
    { id: 'pillar3', kind: 'pillar3', iban_masked: null, balance_rp: 666765 },
  ],
  total_rp: 2348000,
}
