import type { Receipt } from '@/api/types'

/**
 * Router state for the transaction screen after a scan. The backend stores no scanned receipt
 * (GET /api/transactions/{id} still answers receipt: null), so the scan page hands it over.
 */
export type ScanState = { scannedReceipt: Receipt }

export function scannedReceiptFrom(state: unknown): Receipt | null {
  return (state as Partial<ScanState> | null)?.scannedReceipt ?? null
}
