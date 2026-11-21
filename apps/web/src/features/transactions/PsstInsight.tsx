import { useTranslation } from 'react-i18next'
import type { CategorySpending } from '@/api/types'
import SuggestionChip from '@/components/psst/SuggestionChip'
import { formatChf } from '@/lib/money'

/** Petrol Psst card: how this receipt's category compares with a usual month, plus a chat chip. */
export default function PsstInsight({ insight }: { insight: CategorySpending }) {
  const { t, i18n } = useTranslation()
  const category = t(`categories.${insight.category}`)
  const ratio = new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 }).format(insight.ratio)

  return (
    <section className="flex flex-col items-start gap-2.5 rounded-xl bg-psst p-4 text-psst-foreground">
      <p className="text-body">{t('transaction.insight', { category, amount: formatChf(insight.total_rp), ratio })}</p>
      <SuggestionChip question={t('transaction.ask', { category })} />
    </section>
  )
}
