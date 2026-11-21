import type { PaymentMatch, Receipt } from '@/api/types'

/**
 * Router state for the transaction screen right after a scan: the receipt and the checks that
 * found the payment. Later visits get the receipt from the session (scannedReceipts.ts).
 */
export type ScanState = {
  scannedReceipt: Receipt
  match: PaymentMatch | null
  /** The payment had a scanned receipt before this scan, so the screen says "already". */
  alreadyAttached?: boolean
}

export function scanStateFrom(state: unknown): ScanState | null {
  const scan = state as Partial<ScanState> | null
  return scan?.scannedReceipt
    ? { scannedReceipt: scan.scannedReceipt, match: scan.match ?? null, alreadyAttached: scan.alreadyAttached ?? false }
    : null
}
