import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import { useAccounts, useAccountTransactions } from '@/api/queries'
import { Button } from '@/components/ui/button'
import AccountHeader from './AccountHeader'
import TransactionList from './TransactionList'

/** Figma "08 Account detail": one screen for every account; the list comes from the API. */
export default function AccountPage() {
  const { t } = useTranslation()
  const { account: accountId = '' } = useParams()
  const accounts = useAccounts()
  const transactions = useAccountTransactions(accountId)
  const account = accounts.data?.accounts.find((a) => a.id === accountId)
  const unknown = accounts.isSuccess && !account
  const failed = accounts.isError || transactions.isError
  const retry = () => {
    if (accounts.isError) void accounts.refetch()
    if (transactions.isError) void transactions.refetch()
  }

  return (
    <div className="flex flex-1 flex-col bg-card">
      <AccountHeader account={account} />

      <div className="flex flex-col px-4 pt-5 pb-6">
        {unknown ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-body">{t('account.notFound')}</p>
            <Link to="/" className="text-body font-semibold underline underline-offset-4">
              {t('account.toHome')}
            </Link>
          </div>
        ) : (
          <>
            {/* Visual only in the MVP. */}
            <div className="rounded-lg bg-background px-4 py-3.5 text-heading">{t('account.pendingOrders')}</div>

            {(accounts.isPending || transactions.isPending) && !failed && (
              <p className="py-8 text-center text-small">{t('common.loading')}</p>
            )}

            {failed && (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <p role="alert" className="text-body text-destructive">
                  {t('common.loadError')}
                </p>
                <Button variant="outline" className="h-11 rounded-full px-5 text-body font-semibold" onClick={retry}>
                  {t('common.retry')}
                </Button>
              </div>
            )}

            {account && transactions.data?.length === 0 && (
              <p className="py-8 text-center text-body text-muted-foreground">{t('account.empty')}</p>
            )}

            {account && transactions.data && transactions.data.length > 0 && (
              <TransactionList transactions={transactions.data} />
            )}
          </>
        )}
      </div>
    </div>
  )
}
