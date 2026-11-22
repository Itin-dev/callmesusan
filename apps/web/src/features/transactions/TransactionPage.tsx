import type { ChangeEventHandler } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useParams } from 'react-router'
import cameraIcon from '@/assets/icons/camera.svg'
import detailsIcon from '@/assets/icons/details.svg'
import { isNotFound, useReceiptInsight, useTransaction } from '@/api/queries'
import type { PaymentMatch } from '@/api/types'
import BackButton from '@/components/shell/BackButton'
import { Button } from '@/components/ui/button'
import { scannedReceiptFor } from '@/features/scan/scannedReceipts'
import ScanFeedback from '@/features/scan/ScanFeedback'
import { scanStateFrom } from '@/features/scan/scanState'
import { useReceiptScan } from '@/features/scan/useReceiptScan'
import { formatDate } from '@/lib/date'
import { formatChf } from '@/lib/money'
import { cn } from '@/lib/utils'
import PsstInsight from './PsstInsight'
import ReceiptCard from './ReceiptCard'
import TransactionSummary from './TransactionSummary'

/** Figma "04 Transaction + receipt": amount, bank text, receipt items and a Psst insight. */
export default function TransactionPage() {
  const { t } = useTranslation()
  const { id = '' } = useParams()
  const { data: loaded, isPending, isError, error, refetch } = useTransaction(id)
  // The backend stores no scan: right after a scan the receipt comes with the navigation (FE-7),
  // later from the session.
  const justScanned = scanStateFrom(useLocation().state)
  const scanned = justScanned?.scannedReceipt ?? scannedReceiptFor(id)
  const transaction = loaded && scanned && !loaded.receipt ? { ...loaded, receipt: scanned, has_receipt: true } : loaded
  const { data: insight } = useReceiptInsight(transaction)
  // a second scan of the payment, or a photo of a receipt the shop already sent
  const alreadyAttached = Boolean(justScanned?.alreadyAttached || loaded?.receipt)

  return (
    <div className="flex flex-col gap-4 px-4 pt-3 pb-6">
      <Header />

      {isPending && <p className="text-small">{t('common.loading')}</p>}

      {isError && isNotFound(error) && (
        <div className="flex flex-col items-center gap-3 rounded-xl bg-card p-4 text-center">
          <p className="text-body">{t('transaction.notFound')}</p>
          <Link to="/" className="text-body font-semibold underline underline-offset-4">
            {t('transaction.toHome')}
          </Link>
        </div>
      )}

      {isError && !isNotFound(error) && (
        <div className="flex flex-col items-center gap-3 rounded-xl bg-card p-4 text-center">
          <p role="alert" className="text-body text-destructive">
            {t('common.loadError')}
          </p>
          <Button variant="outline" className="h-11 rounded-full px-5 text-body font-semibold" onClick={() => void refetch()}>
            {t('common.retry')}
          </Button>
        </div>
      )}

      {transaction && (
        <>
          {justScanned && (
            <div
              role="status"
              className={cn(
                'flex flex-col gap-2 rounded-xl bg-card p-4',
                // red: the user sees at once that this scan added nothing new
                alreadyAttached && 'border-2 border-destructive text-destructive',
              )}
            >
              <p className="text-body font-semibold">
                {t(alreadyAttached ? 'transaction.receiptAlready' : 'transaction.receiptAdded', {
                  shop: transaction.counterparty,
                  date: formatDate(transaction.date),
                  amount: formatChf(transaction.amount_rp),
                })}
              </p>
              {justScanned.match && <MatchChecks match={justScanned.match} />}
            </div>
          )}
          <TransactionSummary transaction={transaction} />
          {transaction.receipt && <ReceiptCard receipt={transaction.receipt} highlight={insight?.category} />}
          {insight && <PsstInsight insight={insight} />}
          {/* Only without a receipt. Scans the photo like Home "Scan", then the user checks it. */}
          {!transaction.receipt && <AddReceiptPhoto transactionId={transaction.id} />}
        </>
      )}
    </div>
  )
}

/**
 * Camera or photo picker for a payment without a receipt. A receipt is only added when it matches
 * this payment and the user confirms it; otherwise Psst says why and offers to scan the right one.
 */
function AddReceiptPhoto({ transactionId }: { transactionId: string }) {
  const { t } = useTranslation()
  const receiptScan = useReceiptScan({ confirm: true })
  const { scan, onChange, proposal, accept, decline, declined } = receiptScan

  if (proposal) {
    const { receipt, match } = proposal
    // fallback: the model could not read the photo and the backend sent its prepared demo receipt
    const verdict = proposal.fallback ? 'notReceipt' : proposal.transaction_id === transactionId ? 'matches' : 'otherPurchase'
    const shop = { store: receipt.store, branch: receipt.branch, time: receipt.time, amount: formatChf(receipt.total_rp) }
    return (
      <div
        role="group"
        aria-label={t('transaction.confirm.title')}
        className={cn('flex flex-col gap-3 rounded-xl bg-card p-4', verdict !== 'matches' && 'border-2 border-destructive')}
      >
        <p className={cn('text-body font-semibold', verdict !== 'matches' && 'text-destructive')}>
          {t(`transaction.confirm.${verdict}`, shop)}
        </p>
        {verdict === 'matches' ? (
          <>
            {match && <MatchChecks match={match} />}
            <ReceiptCard receipt={receipt} />
            <div className="flex gap-2">
              <Button className="h-11 flex-1 rounded-full text-body font-semibold" onClick={accept}>
                {t('transaction.confirm.accept')}
              </Button>
              <Button variant="outline" className="h-11 flex-1 rounded-full text-body font-semibold" onClick={decline}>
                {t('transaction.confirm.decline')}
              </Button>
            </div>
          </>
        ) : (
          <PhotoPicker label={t('transaction.confirm.rescan')} pending={scan.isPending} onChange={onChange} />
        )}
      </div>
    )
  }

  return (
    <>
      {declined && (
        <p role="status" className="rounded-xl bg-card p-4 text-body">
          {t('transaction.confirm.declined')}
        </p>
      )}
      <PhotoPicker label={t('transaction.addPhoto')} pending={scan.isPending} onChange={onChange} />
      <ScanFeedback scan={receiptScan} />
    </>
  )
}

/** Outline button that opens the camera or the photo picker. */
function PhotoPicker({ label, pending, onChange }: { label: string; pending: boolean; onChange: ChangeEventHandler<HTMLInputElement> }) {
  return (
    <label
      className={cn(
        'flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full border-[1.5px] border-foreground text-body font-semibold text-foreground hover:bg-card has-focus-visible:ring-3 has-focus-visible:ring-ring/50',
        pending && 'pointer-events-none opacity-50',
      )}
    >
      <img src={cameraIcon} alt="" width={24} height={24} />
      {label}
      <input type="file" accept="image/*" capture="environment" className="sr-only" disabled={pending} onChange={onChange} />
    </label>
  )
}

/** The simple checks the backend used to find the payment for a scanned receipt. */
function MatchChecks({ match }: { match: PaymentMatch }) {
  const { t } = useTranslation()
  const checks: [boolean, string][] = [
    [match.amount_matches, t('transaction.checks.amount')],
    [true, t(match.days_apart === 0 ? 'transaction.checks.sameDay' : 'transaction.checks.dayApart')],
    [match.merchant_matches, t(match.merchant_matches ? 'transaction.checks.merchant' : 'transaction.checks.otherMerchant')],
  ]
  return (
    <ul aria-label={t('transaction.checks.title')} className="flex flex-col gap-1 text-small">
      {checks.map(([passed, label]) => (
        <li key={label}>
          {passed ? '✓' : '•'} {label}
        </li>
      ))}
    </ul>
  )
}

function Header() {
  const { t } = useTranslation()
  return (
    <div className="flex items-center justify-between">
      <BackButton />
      <h1 className="text-title">{t('transaction.title')}</h1>
      {/* Decorative in the MVP (Figma "details" menu). */}
      <span className="flex size-11 items-center justify-center -me-2.5">
        <img src={detailsIcon} alt="" width={24} height={24} />
      </span>
    </div>
  )
}
