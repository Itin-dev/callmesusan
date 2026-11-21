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

/** Fixed list of receipt item categories (docs/mvp.md). */
export type ItemCategory =
  | 'dairy'
  | 'bakery'
  | 'fruit'
  | 'vegetables'
  | 'meat_fish'
  | 'eggs'
  | 'pasta'
  | 'frozen'
  | 'spreads'
  | 'snacks'
  | 'chocolate'
  | 'beverages'
  | 'coffee'
  | 'alcohol'
  | 'household'
  | 'personal_care'

export type TransactionType = 'expense' | 'income' | 'transfer'

/** Item of GET /api/transactions. */
export type Transaction = {
  id: string
  account: 'privat' | 'kk'
  date: string // YYYY-MM-DD
  type: TransactionType
  /** Raw bank text, e.g. "Coop Luzern Bahnhof 2025-11-19". */
  description: string
  counterparty: string
  amount_rp: number
  currency: string
  original_amount: number | null
  original_currency: string | null
  has_receipt: boolean
}

export type ReceiptItem = {
  name: string
  category: ItemCategory
  /** Pieces, or kilograms (decimal) when unit is "kg". */
  quantity: number
  /** Only for weighed items. */
  unit?: 'kg'
  unit_price_rp: number
  line_total_rp: number
  /** Discount on this line, subtracted from line_total_rp. */
  discount_rp?: number
}

/** Net per category: sum of line_total_rp − discount_rp. */
export type CategoryTotal = { category: ItemCategory; total_rp: number }

export type Receipt = {
  receipt_id: string
  store: string
  branch: string
  time: string // HH:MM
  source: 'store_app' | 'photo'
  total_rp: number
  items: ReceiptItem[]
  category_totals: CategoryTotal[]
}

/** GET /api/transactions/{id}. */
export type TransactionDetail = Transaction & {
  receipt: Receipt | null
  /** Plain-language explanation of the bank text (BE-5, stretch): may be missing. */
  explanation?: string | null
}

export type CategorySpending = {
  category: ItemCategory
  total_rp: number
  average_rp: number
  ratio: number
}

/** GET /api/spending/categories?month=YYYY-MM. */
export type SpendingByCategory = {
  month: string
  categories: CategorySpending[]
}
