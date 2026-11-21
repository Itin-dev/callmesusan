import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import plusIcon from '@/assets/icons/plus.svg'
import receiptIcon from '@/assets/icons/receipt.svg'
import type { Transaction } from '@/api/types'
import { Badge } from '@/components/ui/badge'
import { formatSignedAmount } from '@/lib/money'
import { scannedReceiptFor } from '@/features/scan/scannedReceipts'
import { cn } from '@/lib/utils'
import { formatDay, groupByDay, localIsoDate, merchantInitials, receiptBadge } from './transactionDisplay'

/** Transactions grouped by day ("Today", "Yesterday", then dd.mm.yyyy); each row opens the transaction. */
export default function TransactionList({ transactions }: { transactions: Transaction[] }) {
  const { t } = useTranslation()
  // Fixed for the life of the screen, so a re-render never moves rows between day headings.
  const [today] = useState(() => localIsoDate(new Date()))

  return (
    <section aria-labelledby="transactions-title" className="flex flex-col">
      <h2 id="transactions-title" className="sr-only">
        {t('account.transactions')}
      </h2>
      {groupByDay(transactions).map((group) => {
        const day = formatDay(group.date, today)
        return (
          <section key={group.date} aria-labelledby={`day-${group.date}`} className="flex flex-col pt-5">
            <h3 id={`day-${group.date}`} className="border-b pb-2 text-sm text-muted-foreground">
              {day === 'today' || day === 'yesterday' ? t(`account.${day}`) : day}
            </h3>
            <ul className="flex flex-col">
              {group.transactions.map((transaction) => (
                <li key={transaction.id}>
                  <TransactionRow transaction={transaction} />
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </section>
  )
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const direction = transaction.type === 'income' ? 'credit' : 'debit'
  return (
    <Link
      to={`/transactions/${encodeURIComponent(transaction.id)}`}
      className="flex min-h-16 items-center gap-3 rounded-lg py-2.5 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span
        aria-hidden="true"
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-psst text-small font-bold text-psst-foreground"
      >
        {merchantInitials(transaction.counterparty)}
      </span>
      <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
        <span className="text-sm font-semibold break-words">{transaction.description}</span>
        <ReceiptBadge transaction={transaction} />
      </span>
      <span className="shrink-0 text-body" dir="ltr">
        {formatSignedAmount(transaction.amount_rp, direction)}
      </span>
    </Link>
  )
}

/** "Receipt" (attached or scanned) or "+ Add receipt" (missing). Add receipt is visual only in the MVP. */
function ReceiptBadge({ transaction }: { transaction: Transaction }) {
  const { t } = useTranslation()
  const badge = receiptBadge(transaction, scannedReceiptFor(transaction.id) !== null)
  if (!badge) return null
  return (
    <Badge
      variant={badge === 'receipt' ? 'secondary' : 'default'}
      className={cn('text-caption font-semibold', badge === 'receipt' && 'bg-background text-foreground')}
    >
      <img src={badge === 'receipt' ? receiptIcon : plusIcon} alt="" width={14} height={14} />
      {t(badge === 'receipt' ? 'account.receipt' : 'account.addReceipt')}
    </Badge>
  )
}
