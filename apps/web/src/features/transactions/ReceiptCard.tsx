import { useTranslation } from 'react-i18next'
import receiptIcon from '@/assets/icons/receipt.svg'
import type { ItemCategory, Receipt, ReceiptItem } from '@/api/types'
import { Badge } from '@/components/ui/badge'
import { formatAmount, formatChf } from '@/lib/money'
import { cn } from '@/lib/utils'

type Props = {
  receipt: Receipt
  /** Category the Psst insight talks about; its items are highlighted in yellow. */
  highlight?: ItemCategory
}

/** Item-level receipt (from the store app or a photo) with its total. */
export default function ReceiptCard({ receipt, highlight }: Props) {
  const { t } = useTranslation()

  return (
    <section aria-labelledby="receipt-title" className="flex flex-col rounded-xl bg-card p-4">
      <div className="flex items-center gap-2 pb-2.5">
        <img src={receiptIcon} alt="" width={24} height={24} />
        <h2 id="receipt-title" className="flex-1 text-heading">
          {t('transaction.receipt')}
        </h2>
        <Badge className="h-auto rounded-[10px] bg-background px-2.5 py-1 text-caption font-medium text-muted-foreground">
          {t(`transaction.source.${receipt.source}`)}
        </Badge>
      </div>

      <ul className="flex flex-col">
        {receipt.items.map((item, index) => (
          <li
            key={`${item.name}-${index}`}
            className={cn(
              'flex flex-col py-[7px] text-sm',
              item.category === highlight && '-mx-2 rounded-sm bg-primary px-2 font-semibold text-primary-foreground',
            )}
          >
            <span className="flex items-start justify-between gap-3">
              <span className="min-w-0">
                {item.name}
                <Quantity item={item} />
              </span>
              <span className="shrink-0" dir="ltr">
                {formatAmount(item.line_total_rp)}
              </span>
            </span>
            {item.discount_rp ? (
              <span className={cn('flex justify-between gap-3 text-small', item.category !== highlight && 'text-muted-foreground')}>
                <span>{t('transaction.discount')}</span>
                <span dir="ltr">−{formatAmount(item.discount_rp)}</span>
              </span>
            ) : null}
          </li>
        ))}
      </ul>

      <p className="mt-1 flex justify-between border-t pt-2.5 text-body font-bold">
        <span>{t('transaction.total')}</span>
        <span dir="ltr">{formatChf(receipt.total_rp)}</span>
      </p>
    </section>
  )
}

/** "0.714 kg" for weighed items, "× 2" for several pieces, nothing for one piece. */
function Quantity({ item }: { item: ReceiptItem }) {
  const { t, i18n } = useTranslation()
  if (item.unit !== 'kg' && item.quantity <= 1) return null
  const text =
    item.unit === 'kg'
      ? t('transaction.weight', {
          weight: new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 3 }).format(item.quantity),
        })
      : t('transaction.quantity', { count: item.quantity })
  return (
    <>
      {' '}
      <span className="whitespace-nowrap">{text}</span>
    </>
  )
}
