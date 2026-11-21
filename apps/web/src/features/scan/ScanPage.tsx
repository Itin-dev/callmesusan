import { useState, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { ApiError } from '@/api/client'
import { useScanReceipt } from '@/api/queries'
import cameraIcon from '@/assets/icons/camera.svg'
import BackButton from '@/components/shell/BackButton'
import { Button } from '@/components/ui/button'
import ReceiptCard from '@/features/transactions/ReceiptCard'
import { cn } from '@/lib/utils'
import { rememberScan, scannedReceiptFor } from './scannedReceipts'
import type { ScanState } from './scanState'

/** Home "Scan": photo of a shop receipt → Psst attaches it to the matching payment. */
export default function ScanPage() {
  const { t } = useTranslation()
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
        // Replace: Back from the payment goes to where Scan was opened, not to this page.
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

  return (
    <div className="flex flex-col gap-4 px-4 pt-3 pb-6">
      <div className="flex items-center justify-between">
        <BackButton />
        <h1 className="text-title">{t('scan.title')}</h1>
        <span className="size-11 -me-2.5" />
      </div>

      <section className="flex flex-col gap-4 rounded-xl bg-card p-4">
        <p className="text-body">{t('scan.intro')}</p>
        <label
          className={cn(
            'flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-primary text-body font-semibold text-primary-foreground has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
            scan.isPending && 'pointer-events-none opacity-50',
          )}
        >
          <img src={cameraIcon} alt="" width={24} height={24} />
          {t('scan.choose')}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            disabled={scan.isPending}
            onChange={onChange}
          />
        </label>
        {scan.isPending && (
          <p role="status" className="text-center text-body">
            {t('scan.reading')}
          </p>
        )}
      </section>

      {scan.isError && (
        <div className="flex flex-col items-center gap-3 rounded-xl bg-card p-4 text-center">
          <p role="alert" className="text-body text-destructive">
            {t(status === 413 ? 'scan.tooBig' : status === 415 ? 'scan.wrongType' : 'scan.error')}
          </p>
          {photo && !rejected && (
            <Button variant="outline" className="h-11 rounded-full px-5 text-body font-semibold" onClick={() => send(photo)}>
              {t('common.retry')}
            </Button>
          )}
        </div>
      )}

      {scan.data && !scan.data.transaction_id && (
        <>
          <p className="rounded-xl bg-card p-4 text-body">{t('scan.noMatch')}</p>
          <ReceiptCard receipt={scan.data.receipt} />
        </>
      )}
    </div>
  )
}
