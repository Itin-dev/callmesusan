// Types for the API contract in docs/mvp.md. Amounts are integer Rappen (*_rp), always positive.

export type AccountKind = 'private' | 'savings' | 'pillar3'

/** Home account row. Not in the contract yet: served from a fixture (see accounts.ts). */
export type Account = {
  id: string
  kind: AccountKind
  /** Masked IBAN, e.g. "CH•• •••• •••• 4821"; null for products without one (3rd pillar). */
  iban_masked: string | null
  balance_rp: number
}

export type AccountsOverview = {
  accounts: Account[]
  total_rp: number
}
