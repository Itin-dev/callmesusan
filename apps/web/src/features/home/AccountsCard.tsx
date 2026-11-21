import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { useAccounts } from '@/api/queries'
import { formatChf } from '@/lib/money'

/** "Accounts and Investments": balances come from the API; the UI only formats them. */
export default function AccountsCard() {
  const { t } = useTranslation()
  const { data, isPending, isError } = useAccounts()

  return (
    <section aria-labelledby="accounts-title" className="flex flex-col gap-5">
      <div className="flex items-start justify-between text-body font-medium text-muted-foreground">
        <h2 id="accounts-title">{t('accounts.title')}</h2>
        {data && <p>{formatChf(data.total_rp, 'credit')}</p>}
      </div>

      {isPending && <p className="text-small text-muted-foreground">{t('common.loading')}</p>}
      {isError && (
        <p role="alert" className="text-small text-destructive">
          {t('common.loadError')}
        </p>
      )}
      {data && (
        <ul className="flex flex-col rounded-xl bg-card px-4 py-1">
          {data.accounts.map((account) => (
            <li key={account.id} className="border-b last:border-b-0">
              <Link
                to={`/accounts/${encodeURIComponent(account.id)}`}
                className="flex items-center gap-3 rounded-lg py-3.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-heading">{t(`accounts.kind.${account.kind}`)}</span>
                  <span className="text-small text-muted-foreground" dir="ltr">
                    {account.iban_masked ?? t(account.kind === 'credit_card' ? 'accounts.card' : 'accounts.retirement')}
                  </span>
                </span>
                <span className="text-heading font-medium" dir="ltr">
                  {formatChf(account.balance_rp, 'credit')}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
