import { useTranslation } from 'react-i18next'
import detailsIcon from '@/assets/icons/details.svg'
import searchIcon from '@/assets/icons/search.svg'
import transferIcon from '@/assets/icons/transfer.svg'
import type { Account } from '@/api/types'
import QuickAction from '@/components/psst/QuickAction'
import BackButton from '@/components/shell/BackButton'
import { formatChf } from '@/lib/money'

// Decorative balance history, bar heights in px as in Figma "08 Account detail" (no data behind it).
const BARS = [14, 16, 15, 14, 92, 88, 86, 72, 72, 70, 69, 66, 64, 62, 60, 56, 55, 50, 48, 46, 42, 40, 38, 34, 30, 28, 26, 24, 22, 20, 18, 16]

/** Mint header: back, name and balance, balance chart, actions. */
export default function AccountHeader({ account }: { account: Account | undefined }) {
  const { t } = useTranslation()

  return (
    <>
      <header className="flex flex-col bg-background pt-3">
        <div className="flex items-center px-4">
          <BackButton />
        </div>
        <div className="mt-2 flex min-h-10 items-center justify-between gap-3 px-4">
          {account && (
            <>
              <h1 className="text-title font-bold">{t(`accounts.kind.${account.kind}`)}</h1>
              <p className="text-heading font-medium" dir="ltr">
                {formatChf(account.balance_rp)}
              </p>
            </>
          )}
        </div>
        <div className="mt-20 flex h-23 items-end justify-between gap-1 px-1" aria-hidden="true">
          {BARS.map((height, index) => (
            <span key={index} className="w-2 min-w-0 shrink rounded-sm bg-border" style={{ height }} />
          ))}
        </div>
      </header>

      <div className="relative -mt-7 flex justify-center gap-7">
        <QuickAction icon={transferIcon} label={t('account.actions.payments')} variant="primary" />
        <QuickAction icon={searchIcon} label={t('account.actions.search')} />
        <QuickAction icon={detailsIcon} label={t('account.actions.details')} />
      </div>
    </>
  )
}
