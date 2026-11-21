import { ChevronDown, Leaf, SlidersHorizontal } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import psstIcon from '@/assets/icons/psst-light.svg'
import searchIcon from '@/assets/icons/search.svg'
import { useSpendingSummary } from '@/api/queries'
import QuickAction from '@/components/psst/QuickAction'
import BackButton from '@/components/shell/BackButton'
import { Button } from '@/components/ui/button'
import SuggestionChip from '@/components/psst/SuggestionChip'
import { formatPeriod } from '@/lib/date'
import { formatChf, formatChfWhole } from '@/lib/money'
import { cn } from '@/lib/utils'
import IncomeExpenseChart from './IncomeExpenseChart'

const PSST_QUESTIONS = ['analytics.psstCard.lastMonth', 'analytics.psstCard.spendLess'] as const

/** Analytics (Figma "03 Analytics + Ask Psst"): income vs expenditures, with Ask Psst in the action row. */
export default function AnalyticsPage() {
  const { t, i18n } = useTranslation()
  const { data: summary, isPending, isError, refetch } = useSpendingSummary()
  const question = t('analytics.askQuestion')

  return (
    <div className="flex flex-col gap-5 px-4 pt-3 pb-6">
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <BackButton />
          {/* Filters are decorative in the MVP. */}
          <SlidersHorizontal aria-hidden className="size-6" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-title font-bold">{t('analytics.title')}</h1>
          <span className="flex items-center gap-1 rounded-full bg-card px-3.5 py-2 text-small font-medium">
            {t('analytics.summarised')}
            <ChevronDown aria-hidden className="size-4" />
          </span>
        </div>
      </header>

      {isPending && <p className="text-small">{t('common.loading')}</p>}

      {isError && (
        <div className="flex flex-col items-center gap-3 rounded-lg bg-card p-4 text-center">
          <p role="alert" className="text-body text-destructive">
            {t('common.loadError')}
          </p>
          <Button variant="outline" className="h-11 rounded-full px-5 text-body font-semibold" onClick={() => void refetch()}>
            {t('common.retry')}
          </Button>
        </div>
      )}

      {summary && (
        <section aria-labelledby="analytics-story" className="flex flex-col items-center gap-3 rounded-lg bg-card p-4">
          <IncomeExpenseChart incomeRp={summary.income.total_rp} expensesRp={summary.expenses.total_rp}>
            <p className="text-title" dir="ltr">
              {formatChfWhole(summary.expenses.monthly_average_rp)}
            </p>
            <p className="max-w-28 text-caption text-muted-foreground">{t('analytics.perMonth')}</p>
          </IncomeExpenseChart>
          <p id="analytics-story" className="text-center text-body">
            {t('analytics.story', {
              period: formatPeriod(summary.period_start, summary.period_end, i18n.language),
              income: formatChfWhole(summary.income.total_rp),
              expenses: formatChfWhole(summary.expenses.total_rp),
            })}
          </p>
        </section>
      )}

      <div className="flex justify-center gap-7">
        <QuickAction icon={searchIcon} label={t('analytics.actions.search')} />
        <QuickAction icon={<Leaf aria-hidden className="size-6" />} label={t('analytics.actions.co2')} />
        <QuickAction
          icon={psstIcon}
          label={t('analytics.actions.askPsst')}
          variant="psst"
          to={`/psst?q=${encodeURIComponent(question)}`}
        />
      </div>

      {summary && (
        <ul className="flex flex-col divide-y rounded-lg bg-card px-4">
          <TotalsRow label={t('analytics.income')} dot="bg-chart-1" amountRp={summary.income.total_rp} count={summary.income.count} />
          <TotalsRow label={t('analytics.expenses')} dot="bg-chart-3" amountRp={summary.expenses.total_rp} count={summary.expenses.count} />
        </ul>
      )}

      <section aria-labelledby="analytics-psst" className="flex flex-col items-start gap-3 rounded-xl bg-psst p-4 text-psst-foreground">
        <h2 id="analytics-psst" className="flex items-center gap-2 text-heading">
          <img src={psstIcon} alt="" width={24} height={24} />
          {t('analytics.psstCard.title')}
        </h2>
        <div className="flex flex-wrap gap-2">
          {PSST_QUESTIONS.map((key) => (
            <SuggestionChip key={key} question={t(key)} />
          ))}
        </div>
      </section>
    </div>
  )
}

function TotalsRow({ label, dot, amountRp, count }: { label: string; dot: string; amountRp: number; count: number }) {
  const { t } = useTranslation()
  return (
    <li className="flex items-center gap-3 py-3.5">
      <span aria-hidden className={cn('size-3 shrink-0 rounded-full', dot)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-heading">{label}</span>
        <span className="text-small text-muted-foreground">{t('analytics.count', { count })}</span>
      </div>
      <span className="text-heading" dir="ltr">
        {formatChf(amountRp)}
      </span>
    </li>
  )
}
