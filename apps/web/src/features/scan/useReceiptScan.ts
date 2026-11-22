import { useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router'
import { ApiError } from '@/api/client'
import { useScanReceipt } from '@/api/queries'
import { rememberScan, scannedReceiptFor } from './scannedReceipts'
import type { ScanState } from './scanState'

/** Receipt photo → scan → open the matching payment with the receipt. Shared by Scan and a transaction. */
export function useReceiptScan() {
  const navigate = useNavigate()
  const [photo, setPhoto] = useState<File | null>(null)
  const scan = useScanReceipt()
  // 413 / 415: the same photo would fail again, so no retry; the user picks another one.
  const status = scan.error instanceof ApiError ? scan.error.status : 0
  const rejected = status === 413 || status === 415

  const send = (file: File) =>
    scan.mutate(file, {
      onSuccess: ({ transaction_id, receipt, match }) => {
        // ask before rememberScan, which replaces the earlier scan of this payment
        const alreadyAttached = transaction_id !== null && scannedReceiptFor(transaction_id) !== null
        rememberScan(transaction_id, receipt)
        if (!transaction_id) return
        // Replace: Back from the payment goes to where the scan was started, not to the scan step.
        navigate(`/transactions/${encodeURIComponent(transaction_id)}`, {
          replace: true,
          state: { scannedReceipt: receipt, match, alreadyAttached } satisfies ScanState,
        })
      },
    })

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = '' // the same photo can be picked again
    if (!file) return
    setPhoto(file)
    send(file)
  }

  return { scan, photo, status, rejected, send, onChange }
}

export type ReceiptScan = ReturnType<typeof useReceiptScan>
