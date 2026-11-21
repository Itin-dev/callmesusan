import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import backIcon from '@/assets/icons/back.svg'
import cameraIcon from '@/assets/icons/camera.svg'
import detailsIcon from '@/assets/icons/details.svg'
import { isNotFound, useReceiptInsight, useTransaction } from '@/api/queries'
import { Button } from '@/components/ui/button'
import PsstInsight from './PsstInsight'
import ReceiptCard from './ReceiptCard'
import TransactionSummary from './TransactionSummary'

/** Figma "04 Transaction + receipt": amount, bank text, receipt items and a Psst insight. */
export default function TransactionPage() {
  const { t } = useTranslation()
  const { id = '' } = useParams()
  const { data: transaction, isPending, isError, error, refetch } = useTransaction(id)
  const { data: insight } = useReceiptInsight(transaction)

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
          <TransactionSummary transaction={transaction} />
          {transaction.receipt && <ReceiptCard receipt={transaction.receipt} highlight={insight?.category} />}
          {insight && <PsstInsight insight={insight} />}
          {/* No function in the MVP: photo upload comes later. */}
          <button
            type="button"
            className="flex h-12 items-center justify-center gap-2 rounded-full border-[1.5px] border-foreground text-body font-semibold outline-none hover:bg-card focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <img src={cameraIcon} alt="" width={24} height={24} />
            {t('transaction.addPhoto')}
          </button>
        </>
      )}
    </div>
  )
}

function Header() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  // Opened directly (no history inside the app): go to Home instead of leaving the app.
  const goBack = () => (location.key === 'default' ? navigate('/') : navigate(-1))

  return (
    <div className="flex items-center justify-between">
      <Button variant="ghost" size="icon" className="-ms-2.5 size-11 rounded-full" aria-label={t('transaction.back')} onClick={goBack}>
        <img src={backIcon} alt="" width={24} height={24} className="rtl:-scale-x-100" />
      </Button>
      <h1 className="text-title">{t('transaction.title')}</h1>
      {/* Decorative in the MVP (Figma "details" menu). */}
      <span className="flex size-11 items-center justify-center -me-2.5">
        <img src={detailsIcon} alt="" width={24} height={24} />
      </span>
    </div>
  )
}
