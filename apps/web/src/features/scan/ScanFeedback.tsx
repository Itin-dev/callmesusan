import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import ReceiptCard from '@/features/transactions/ReceiptCard'
import type { ReceiptScan } from './useReceiptScan'

/** Reading, error with retry, or "no payment matches" for a receipt scan. */
export default function ScanFeedback({ scan: { scan, photo, status, rejected, send, proposal } }: { scan: ReceiptScan }) {
  const { t } = useTranslation()
  return (
    <>
      {scan.isPending && (
        <p role="status" className="text-center text-body">
          {t('scan.reading')}
        </p>
      )}

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

      {scan.data && !scan.data.transaction_id && !proposal && (
        <>
          <p className="rounded-xl bg-card p-4 text-body">{t('scan.noMatch')}</p>
          <ReceiptCard receipt={scan.data.receipt} />
        </>
      )}
    </>
  )
}
