// Types for the API contract in docs/mvp.md. Amounts are integer Rappen (*_rp), always positive.

export type AccountKind = 'private' | 'savings' | 'pillar3' | 'credit_card'

/** Accounts that have transactions in GET /api/transactions?account=. */
export type TransactionAccount = 'privat' | 'kk'

/** Home account row of GET /api/accounts. The credit card `kk` is still a frontend stopgap (accounts.ts). */
export type Account = {
  /** privat | savings | pillar3 | kk */
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

/**
 * Proposed in #39, not served yet: attached = receipt linked, missing = a purchase that could
 * have one (shows "+ Add receipt"), none = no receipt expected.
 */
export type ReceiptStatus = 'attached' | 'missing' | 'none'

/** Item of GET /api/transactions. */
export type Transaction = {
  id: string
  account: TransactionAccount
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
  /** Optional until the backend sends it; the UI falls back to has_receipt. */
  receipt_status?: ReceiptStatus
}

export type ReceiptItem = {
  name: string
  category: ItemCategory
  /** Pieces, or kilograms (decimal) when unit is "kg". */
  quantity: number
  /** "kg" for weighed items. */
  unit?: 'pcs' | 'kg'
  unit_price_rp: number
  line_total_rp: number
  /** Discount on this line (0 when none), subtracted from line_total_rp. */
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

/**
 * POST /api/receipts/scan (BE-6, #40): the receipt read from a photo and the id of the payment it
 * matches (total + day + month, matched by the backend), or null when no payment matches.
 */
export type ScanResult = {
  transaction_id: string | null
  receipt: Receipt
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

/** One turn of the Psst chat. */
export type ChatMessage = { role: 'user' | 'assistant'; content: string }

/** POST /api/chat: stateless, the client sends the whole conversation every turn. */
export type ChatRequest = { messages: ChatMessage[]; language: string }

export type ChatResponse = { reply: string }
