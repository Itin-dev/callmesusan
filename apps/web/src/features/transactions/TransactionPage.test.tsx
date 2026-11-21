import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as transactions from '@/api/transactions'
import i18n from '@/i18n'
import { renderApp } from '@/test-utils'

const NBSP = ' '

beforeEach(async () => {
  await i18n.changeLanguage('en')
})

afterEach(() => vi.restoreAllMocks())

describe('TransactionPage', () => {
  it('shows the amount, raw bank text and the Psst explanation', async () => {
    renderApp('/transactions/K-0241')
    expect(screen.getByRole('heading', { level: 1, name: 'Transaction' })).toBeInTheDocument()
    expect(await screen.findByText(`CHF${NBSP}119.70–`)).toBeInTheDocument()
    expect(screen.getByText('Coop Luzern Bahnhof 2025-11-19')).toBeInTheDocument()
    expect(screen.getByText(/Groceries at Coop/)).toBeInTheDocument()
  })

  it('shows the receipt items, quantities, prices and total', async () => {
    renderApp('/transactions/K-0241')
    const receipt = await screen.findByRole('region', { name: 'Receipt' })
    expect(within(receipt).getByText('from store app')).toBeInTheDocument()
    const rows = within(receipt).getAllByRole('listitem')
    expect(rows).toHaveLength(8)
    expect(within(rows[1]).getByText('Fendant du Valais AOC 75cl')).toBeInTheDocument()
    expect(within(rows[1]).getByText('× 2')).toBeInTheDocument()
    expect(within(rows[1]).getByText('23.90')).toBeInTheDocument()
    expect(within(receipt).getByText('Total')).toBeInTheDocument()
    expect(within(receipt).getByText(`CHF${NBSP}119.70`)).toBeInTheDocument()
  })

  it('does not offer a receipt photo when the receipt already exists', async () => {
    renderApp('/transactions/K-0241')
    await screen.findByRole('region', { name: 'Receipt' })
    expect(screen.queryByRole('button', { name: 'Add receipt photo' })).not.toBeInTheDocument()
  })

  it('shows the Psst insight with a chip that opens the chat', async () => {
    renderApp('/transactions/K-0241')
    expect(
      await screen.findByText(`Psst: chocolate this month is CHF${NBSP}38.60, about 2× your usual.`),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'How can I spend less on chocolate?' })).toHaveAttribute(
      'href',
      `/psst?q=${encodeURIComponent('How can I spend less on chocolate?')}`,
    )
  })

  it('works without a receipt', async () => {
    renderApp('/transactions/K-0240')
    expect(await screen.findByText(`CHF${NBSP}39.25–`)).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Receipt' })).not.toBeInTheDocument()
    expect(screen.queryByText(/Psst:/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add receipt photo' })).toBeInTheDocument()
  })

  it('says when the transaction does not exist', async () => {
    renderApp('/transactions/X-9999')
    expect(await screen.findByText('We could not find this transaction.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to Home' })).toHaveAttribute('href', '/')
  })

  it('shows a loading state, then an error with retry', async () => {
    const spy = vi.spyOn(transactions, 'getTransaction').mockRejectedValue(new Error('offline'))
    renderApp('/transactions/K-0241')
    expect(screen.getByText('Loading…')).toBeInTheDocument()
    // The hook retries a failed load once (about 1 s) before it shows the error.
    expect(await screen.findByRole('alert', {}, { timeout: 3000 })).toHaveTextContent('Could not load the data.')

    spy.mockRestore()
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText(`CHF${NBSP}119.70–`)).toBeInTheDocument()
  })

  it('goes back to Home when opened directly', async () => {
    renderApp('/transactions/K-0241')
    await userEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Home' })).toBeInTheDocument()
  })

  it('has no detectable accessibility violations', async () => {
    const { container } = renderApp('/transactions/K-0241')
    await screen.findByText(/Psst: chocolate/)
    const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })
    expect(results.violations.map((v) => v.id)).toEqual([])
  })
})
