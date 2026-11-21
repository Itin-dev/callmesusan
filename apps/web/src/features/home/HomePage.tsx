import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import analysisIcon from '@/assets/icons/analysis.svg'
import micIcon from '@/assets/icons/mic.svg'
import payIcon from '@/assets/icons/pay.svg'
import psstIcon from '@/assets/icons/psst-light.svg'
import scanIcon from '@/assets/icons/scan-any.svg'
import searchIcon from '@/assets/icons/search.svg'
import transferIcon from '@/assets/icons/transfer.svg'
import QuickAction from '@/components/psst/QuickAction'
import SuggestionChip from '@/components/psst/SuggestionChip'
import AccountsCard from './AccountsCard'

const SUGGESTIONS = ['home.suggestions.holiday', 'home.suggestions.cutCosts', 'home.suggestions.tax'] as const

/** Figma "01 Home": quick actions, Psst card, accounts. */
export default function HomePage() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-5 px-4 pt-3 pb-6">
      <div className="flex justify-end">
        <span className="flex items-center gap-2 rounded-full bg-card px-3.5 py-2 text-sm">
          <img src={searchIcon} alt="" width={24} height={24} />
          {t('home.search')}
        </span>
      </div>

      <h1 className="text-center text-hero">{t('home.title')}</h1>

      <div className="flex justify-center gap-3 max-[359px]:gap-1">
        <QuickAction icon={scanIcon} label={t('home.actions.scan')} variant="primary" to="/scan" />
        <QuickAction icon={payIcon} label={t('home.actions.pay')} />
        <QuickAction icon={transferIcon} label={t('home.actions.transfer')} />
        <QuickAction icon={analysisIcon} label={t('home.actions.analysis')} to="/analytics" />
        <QuickAction icon={psstIcon} label={t('psst.name')} variant="psst" to="/psst" />
      </div>

      <section aria-labelledby="psst-card-title" className="flex flex-col gap-3 rounded-xl bg-psst p-4 text-psst-foreground">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <img src={psstIcon} alt="" width={24} height={24} />
          {t('psst.teaser')}
        </p>
        <h2 id="psst-card-title" className="text-lg font-semibold">
          {t('home.psstCard.title')}
        </h2>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((key) => (
            <SuggestionChip key={key} question={t(key)} />
          ))}
        </div>
        <Link
          to="/psst"
          className="flex items-center justify-between rounded-[22px] bg-card px-3.5 py-2.5 text-sm text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {t('home.psstCard.ask')}
          <img src={micIcon} alt="" width={24} height={24} />
        </Link>
      </section>

      <AccountsCard />
    </div>
  )
}
