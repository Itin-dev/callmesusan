import type { Receipt, ScannedReceipt } from '@/api/types'

/**
 * Receipts scanned in this browser session. The backend stores no scan (privacy: the photo can
 * show card data), so the app keeps them here: the payment screen shows them again and every chat
 * turn sends them, so Psst can answer questions about them.
 */
const KEY = 'psst.scannedReceipts'
// POST /api/chat accepts at most 10 receipts
const LIMIT = 10

// used only when the browser blocks sessionStorage (private mode, blocked site data)
let memory: ScannedReceipt[] = []

function read(): ScannedReceipt[] {
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as ScannedReceipt[]) : []
  } catch {
    return memory
  }
}

function write(receipts: ScannedReceipt[]) {
  memory = receipts
  try {
    sessionStorage.setItem(KEY, JSON.stringify(receipts))
  } catch {
    // the in-memory copy still serves this page view
  }
}

/** Keep a scan; a new scan of the same payment replaces the earlier one. */
export function rememberScan(transactionId: string | null, receipt: Receipt) {
  const others = read().filter(
    (r) => r.receipt_id !== receipt.receipt_id && (transactionId === null || r.transaction_id !== transactionId),
  )
  write([...others, { ...receipt, transaction_id: transactionId }].slice(-LIMIT))
}

/** Forget every scan of this session, so the demo can scan the same receipt again. */
export function forgetScans() {
  memory = []
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // only the in-memory copy existed
  }
}

export function scannedReceipts(): ScannedReceipt[] {
  return read()
}

export function scannedReceiptFor(transactionId: string): Receipt | null {
  const found = read().find((r) => r.transaction_id === transactionId)
  if (!found) return null
  const { transaction_id: _, ...receipt } = found
  return receipt
}
