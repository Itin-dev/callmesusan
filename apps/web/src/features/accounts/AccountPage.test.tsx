import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as transactions from '@/api/transactions'
import { TRANSACTION_LIST_FIXTURES } from '@/api/transactions.fixtures'
import i18n from '@/i18n'
import { mockApi, renderApp } from '@/test-utils'

const NBSP = ' '

beforeEach(async () => {
  await i18n.changeLanguage('en')
  // Only Date is faked: "today" is the day after the demo Lidl and Denner purchases.
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2025, 10, 21, 12, 0))
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

const dayHeadings = () => screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)

describe('AccountPage', () => {
  it('shows the account name and balance in the header', async () => {
    mockApi()
    renderApp('/accounts/privat')
    expect(await screen.findByRole('heading', { level: 1, name: 'Private account' })).toBeInTheDocument()
    expect(screen.getByText(`CHF${NBSP}4'812.35`)).toBeInTheDocument()
    const main = screen.getByRole('main')
    for (const action of ['Payments', 'Search', 'Details']) expect(within(main).getByText(action)).toBeInTheDocument()
    expect(screen.getByText('Show pending orders')).toBeInTheDocument()
  })

  it('groups transactions by day, newest first: Today, Yesterday, then dd.mm.yyyy', async () => {
    mockApi()
    renderApp('/accounts/kk')
    expect(await screen.findByRole('heading', { level: 1, name: 'Credit card' })).toBeInTheDocument()
    await screen.findByText('Coop Luzern Bahnhof 2025-11-19')
    expect(dayHeadings()).toEqual(['Today', 'Yesterday', '19.11.2025', '16.11.2025'])
  })

  it('shows initials, raw bank text, amount with trailing minus and a link per row', async () => {
    mockApi()
    renderApp('/accounts/kk')
    const coop = (await screen.findByText('Coop Luzern Bahnhof 2025-11-19')).closest('a')!
    expect(coop).toHaveAttribute('href', '/transactions/K-0241')
    expect(within(coop).getByText('CO')).toBeInTheDocument()
    expect(within(coop).getByText('119.70–')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /\d{4}-\d{2}-\d{2}/ })).toHaveLength(TRANSACTION_LIST_FIXTURES.kk.length)
  })

  it('shows a plus for income', async () => {
    mockApi()
    renderApp('/accounts/privat')
    const salary = (await screen.findByText('Salärzahlung 13. Monatslohn Employer AG')).closest('a')!
    expect(within(salary).getByText("7'464.00+")).toBeInTheDocument()
  })

  it('shows Receipt when attached, Add receipt when missing, nothing otherwise', async () => {
    const [apple, denner, ...rest] = TRANSACTION_LIST_FIXTURES.kk
    mockApi({ lists: { kk: [apple, { ...denner, has_receipt: false, receipt_status: 'missing' }, ...rest] } })
    renderApp('/accounts/kk')
    const row = async (text: string) => (await screen.findByText(text)).closest('a')!
    expect(within(await row('Coop Luzern Bahnhof 2025-11-19')).getByText('Receipt')).toBeInTheDocument()
    expect(within(await row('Denner Kriens Zentrum 2025-11-20')).getByText('Add receipt')).toBeInTheDocument()
    const appleRow = await row('Apple Online Store 2025-11-21')
    expect(within(appleRow).queryByText('Receipt')).not.toBeInTheDocument()
    expect(within(appleRow).queryByText('Add receipt')).not.toBeInTheDocument()
  })

  it('opens the transaction screen from a row', async () => {
    mockApi()
    renderApp('/accounts/kk')
    await userEvent.click(await screen.findByText('Coop Luzern Bahnhof 2025-11-19'))
    expect(await screen.findByRole('heading', { level: 1, name: 'Transaction' })).toBeInTheDocument()
    expect(await screen.findByText(`CHF${NBSP}119.70–`)).toBeInTheDocument()
  })

  it('shows the empty state for an account without transactions, without asking the API', async () => {
    const fetch = mockApi()
    renderApp('/accounts/savings')
    expect(await screen.findByRole('heading', { level: 1, name: 'Savings' })).toBeInTheDocument()
    expect(await screen.findByText('No transactions on this account yet.')).toBeInTheDocument()
    expect(fetch.mock.calls.map(([url]) => String(url))).not.toContainEqual(expect.stringContaining('/api/transactions'))
  })

  it('says when the account does not exist', async () => {
    mockApi()
    renderApp('/accounts/unknown')
    expect(await screen.findByText('We could not find this account.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to Home' })).toHaveAttribute('href', '/')
  })

  it('shows a loading state, then an error with retry', async () => {
    mockApi()
    const spy = vi.spyOn(transactions, 'getAccountTransactions').mockRejectedValue(new Error('offline'))
    renderApp('/accounts/kk')
    expect(screen.getByText('Loading…')).toBeInTheDocument()
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the data.')

    spy.mockRestore()
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('Coop Luzern Bahnhof 2025-11-19')).toBeInTheDocument()
  })

  it('goes back to Home when opened directly', async () => {
    mockApi()
    renderApp('/accounts/kk')
    await userEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Home' })).toBeInTheDocument()
  })

  it('renders right to left in Arabic with amounts kept left to right', async () => {
    mockApi()
    await i18n.changeLanguage('ar')
    renderApp('/accounts/kk')
    expect(document.documentElement.dir).toBe('rtl')
    expect(await screen.findByRole('heading', { level: 1, name: i18n.t('accounts.kind.credit_card') })).toBeInTheDocument()
    const amount = await screen.findByText('119.70–')
    expect(amount).toHaveAttribute('dir', 'ltr')
    expect(screen.getByText(i18n.t('account.yesterday'))).toBeInTheDocument()
  })

  it('has no detectable accessibility violations', async () => {
    mockApi()
    const { container } = renderApp('/accounts/kk')
    await screen.findByText('Coop Luzern Bahnhof 2025-11-19')
    const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })
    expect(results.violations.map((v) => v.id)).toEqual([])
  })
})
