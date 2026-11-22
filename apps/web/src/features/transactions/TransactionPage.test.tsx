import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as transactions from '@/api/transactions'
import { LOLA_SCAN_FIXTURE } from '@/api/receipts.fixtures'
import i18n from '@/i18n'
import * as image from '@/lib/image'
import { TRANSACTION_FIXTURES } from '@/api/transactions.fixtures'
import { mockApi, renderApp } from '@/test-utils'

const NBSP = ' '

beforeEach(async () => {
  await i18n.changeLanguage('en')
  mockApi()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('TransactionPage', () => {
  it('shows the amount, raw bank text and the Psst explanation', async () => {
    const explanation = 'Groceries at Coop in Luzern station, paid with your credit card.'
    mockApi({ transactions: { 'K-0241': { ...TRANSACTION_FIXTURES['K-0241'], explanation } } })
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
    expect(within(receipt).queryByText('Discount')).not.toBeInTheDocument()
  })

  it('shows weighed items and discounts', async () => {
    renderApp('/transactions/K-0242')
    const receipt = await screen.findByRole('region', { name: 'Receipt' })
    const apples = within(receipt).getByText('Apfel rot lose').closest('li')!
    expect(within(apples).getByText('0.714 kg')).toBeInTheDocument()
    expect(within(apples).getByText('1.56')).toBeInTheDocument()
    expect(within(apples).getByText('Discount')).toBeInTheDocument()
    expect(within(apples).getByText('−0.17')).toBeInTheDocument()
    expect(within(receipt).getByText(`CHF${NBSP}84.44`)).toBeInTheDocument()
  })

  it('does not offer a receipt photo when the receipt already exists', async () => {
    renderApp('/transactions/K-0241')
    await screen.findByRole('region', { name: 'Receipt' })
    expect(screen.queryByLabelText('Add receipt photo')).not.toBeInTheDocument()
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

  it('shows the receipt without an insight when the spending categories fail to load', async () => {
    const fetch = mockApi({ categories: Response.json({ detail: 'down' }, { status: 500 }) })
    renderApp('/transactions/K-0241')
    await screen.findByRole('region', { name: 'Receipt' })
    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith('/api/spending/categories?month=2025-11', expect.anything()),
    )
    expect(screen.queryByText(/your usual/)).not.toBeInTheDocument()
  })

  it('hides the explanation when the backend has none', async () => {
    renderApp('/transactions/K-0241')
    await screen.findByRole('region', { name: 'Receipt' })
    expect(screen.queryByText(/Psst explains/)).not.toBeInTheDocument()
  })

  it('works without a receipt', async () => {
    renderApp('/transactions/K-0240')
    expect(await screen.findByText(`CHF${NBSP}39.25–`)).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Receipt' })).not.toBeInTheDocument()
    expect(screen.queryByText(/Psst:/)).not.toBeInTheDocument()
    expect(screen.getByLabelText('Add receipt photo')).toBeInTheDocument()
  })

  it('opens the camera or the photo picker from Add receipt photo', async () => {
    renderApp('/transactions/K-0240')
    const input = await screen.findByLabelText('Add receipt photo')
    expect(input).toHaveAttribute('type', 'file')
    expect(input).toHaveAttribute('accept', 'image/*')
    expect(input).toHaveAttribute('capture', 'environment')
  })

  describe('checking a scanned receipt before adding it', () => {
    const scanFrom = async (id: string) => {
      vi.spyOn(image, 'downscaleImage').mockResolvedValue(new Blob(['small'], { type: 'image/jpeg' }))
      renderApp(`/transactions/${id}`)
      const photo = new File(['raw photo'], 'receipt.png', { type: 'image/png' })
      await userEvent.upload(await screen.findByLabelText('Add receipt photo'), photo)
      return screen.findByRole('group', { name: 'Check the receipt' })
    }

    it('asks before adding a receipt that matches this payment', async () => {
      const check = await scanFrom('P-0236')
      expect(within(check).getByText(`Is this your receipt from LOLA Mattenhof, 11:52, CHF${NBSP}9.10?`)).toBeInTheDocument()
      expect(within(check).getByRole('list', { name: 'Psst checked' })).toBeInTheDocument()
      // the items are shown to compare, but nothing is added yet
      expect(within(check).getByRole('region', { name: 'Receipt' })).toBeInTheDocument()
      expect(screen.getAllByRole('region', { name: 'Receipt' })).toHaveLength(1)

      await userEvent.click(within(check).getByRole('button', { name: 'Yes, add it' }))
      expect(
        await screen.findByText(`Added to your payment at LOLA Mattenhof, 21.11.2025, CHF${NBSP}9.10`),
      ).toBeInTheDocument()
      expect(screen.getByRole('region', { name: 'Receipt' })).toBeInTheDocument()
    })

    it('adds nothing when the user says it is the wrong receipt', async () => {
      const check = await scanFrom('P-0236')
      await userEvent.click(within(check).getByRole('button', { name: 'No, wrong receipt' }))
      expect(await screen.findByText('Receipt not added. Scan the right receipt for this payment.')).toBeInTheDocument()
      expect(screen.queryByRole('group', { name: 'Check the receipt' })).not.toBeInTheDocument()
      expect(screen.queryByRole('region', { name: 'Receipt' })).not.toBeInTheDocument()
      expect(screen.getByLabelText('Add receipt photo')).toBeInTheDocument()
    })

    it('says the receipt is not from this purchase and lets the user scan the right one', async () => {
      const check = await scanFrom('K-0240')
      expect(
        within(check).getByText(`This receipt (LOLA Mattenhof, CHF${NBSP}9.10) is not from this purchase.`),
      ).toBeInTheDocument()
      expect(within(check).queryByRole('button', { name: /add/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('region', { name: 'Receipt' })).not.toBeInTheDocument()

      // the right receipt this time: the scan answers with this payment
      mockApi({ scan: { ...LOLA_SCAN_FIXTURE, transaction_id: 'K-0240' } })
      const right = new File(['right photo'], 'right.png', { type: 'image/png' })
      await userEvent.upload(within(check).getByLabelText('Scan the right receipt'), right)
      expect(await screen.findByRole('button', { name: 'Yes, add it' })).toBeInTheDocument()
    })

    it('says when the photo is not a receipt, even if the demo fallback answers', async () => {
      mockApi({ scan: { ...LOLA_SCAN_FIXTURE, fallback: true } })
      const check = await scanFrom('P-0236')
      expect(
        within(check).getByText("This doesn't look like a receipt. Take a photo of the receipt for this payment."),
      ).toBeInTheDocument()
      expect(within(check).queryByRole('button', { name: 'Yes, add it' })).not.toBeInTheDocument()
      expect(within(check).getByLabelText('Scan the right receipt')).toBeInTheDocument()
    })

    it('says when the receipt matches no payment', async () => {
      mockApi({ scan: { ...LOLA_SCAN_FIXTURE, transaction_id: null, match: null } })
      const check = await scanFrom('K-0240')
      expect(
        within(check).getByText(`This receipt (LOLA Mattenhof, CHF${NBSP}9.10) is not from this purchase.`),
      ).toBeInTheDocument()
    })
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
