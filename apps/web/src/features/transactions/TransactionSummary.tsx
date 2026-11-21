import { useTranslation } from 'react-i18next'
import psstIcon from '@/assets/icons/psst.svg'
import type { TransactionDetail } from '@/api/types'
import { formatChf } from '@/lib/money'

/** Amount, raw bank text and the plain-language "Psst explains" line (when the backend has one). */
export default function TransactionSummary({ transaction }: { transaction: TransactionDetail }) {
  const { t } = useTranslation()
  const direction = transaction.type === 'income' ? 'credit' : 'debit'

  return (
    <section className="flex flex-col items-center gap-1.5 rounded-xl bg-card p-4 text-center">
      <p className="text-display" dir="ltr">
        {formatChf(transaction.amount_rp, direction)}
      </p>
      <p className="text-small text-muted-foreground">{transaction.description}</p>
      {transaction.explanation && (
        <div className="mt-1.5 flex w-full items-center gap-2.5 rounded-[14px] bg-muted px-3 py-2.5 text-start">
          <img src={psstIcon} alt="" width={24} height={24} className="shrink-0" />
          <p className="text-small">
            <span className="sr-only">{t('transaction.explains')}: </span>
            {transaction.explanation}
          </p>
        </div>
      )}
    </section>
  )
}
