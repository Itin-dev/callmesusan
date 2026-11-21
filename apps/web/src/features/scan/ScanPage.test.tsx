import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as receipts from '@/api/receipts'
import { LOLA_SCAN_FIXTURE } from '@/api/receipts.fixtures'
import type { ScanResult } from '@/api/types'
import i18n from '@/i18n'
import * as image from '@/lib/image'
import { mockApi, renderApp } from '@/test-utils'

const NBSP = ' '
const photo = () => new File(['raw photo'], 'receipt.png', { type: 'image/png' })
const small = new Blob(['small'], { type: 'image/jpeg' })
const noMatch: ScanResult = { ...LOLA_SCAN_FIXTURE, transaction_id: null }

beforeEach(async () => {
  await i18n.changeLanguage('en')
  mockApi()
  vi.spyOn(image, 'downscaleImage').mockResolvedValue(small)
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

const choosePhoto = () => userEvent.upload(screen.getByLabelText('Take or choose a photo'), photo())

describe('ScanPage', () => {
  it('opens from the yellow Scan action on Home', async () => {
    renderApp('/')
    await userEvent.click(screen.getByRole('link', { name: 'Scan' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Scan a receipt' })).toBeInTheDocument()
  })

  it('opens the camera or the photo picker', () => {
    renderApp('/scan')
    const input = screen.getByLabelText('Take or choose a photo')
    expect(input).toHaveAttribute('type', 'file')
    expect(input).toHaveAttribute('accept', 'image/*')
    expect(input).toHaveAttribute('capture', 'environment')
  })

  it('uploads the downscaled photo and opens the matching payment with the receipt', async () => {
    const scan = vi.spyOn(receipts, 'scanReceipt')
    renderApp('/scan')
    await choosePhoto()

    expect(scan).toHaveBeenCalledWith(small)
    expect(
      await screen.findByText(`Added to your payment at LOLA Mattenhof, 21.11.2025, CHF${NBSP}9.10`),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Transaction' })).toBeInTheDocument()
    const receipt = screen.getByRole('region', { name: 'Receipt' })
    expect(within(receipt).getByText('from photo')).toBeInTheDocument()
    expect(within(receipt).getAllByRole('listitem')).toHaveLength(4)
    expect(within(receipt).getByText('Club-Mate, Loscher, 50cl')).toBeInTheDocument()
    expect(within(receipt).getByText(`CHF${NBSP}9.10`)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add receipt photo' })).not.toBeInTheDocument()
  })

  it('goes back to Home from the matched payment', async () => {
    renderApp('/')
    await userEvent.click(screen.getByRole('link', { name: 'Scan' }))
    await choosePhoto()
    await screen.findByText(/Added to your payment/)
    await userEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Home' })).toBeInTheDocument()
  })

  it('shows a loading state while Psst reads the receipt', async () => {
    let answer: (result: ScanResult) => void = () => {}
    vi.spyOn(receipts, 'scanReceipt').mockReturnValue(new Promise((resolve) => (answer = resolve)))
    renderApp('/scan')
    await choosePhoto()
    expect(await screen.findByRole('status')).toHaveTextContent('Psst is reading your receipt…')
    answer(noMatch)
    expect(await screen.findByText(/no payment matches/)).toBeInTheDocument()
    expect(screen.queryByText('Psst is reading your receipt…')).not.toBeInTheDocument()
  })

  it('shows the read receipt when no payment matches', async () => {
    vi.spyOn(receipts, 'scanReceipt').mockResolvedValue(noMatch)
    renderApp('/scan')
    await choosePhoto()
    expect(await screen.findByText('Psst read the receipt, but no payment matches it.')).toBeInTheDocument()
    const receipt = screen.getByRole('region', { name: 'Receipt' })
    expect(within(receipt).getAllByRole('listitem')).toHaveLength(4)
    expect(screen.getByRole('heading', { level: 1, name: 'Scan a receipt' })).toBeInTheDocument()
  })

  it('shows an error and sends the same photo again on retry', async () => {
    const scan = vi
      .spyOn(receipts, 'scanReceipt')
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(noMatch)
    renderApp('/scan')
    await choosePhoto()
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not read the receipt. Please try again.')
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText(/no payment matches/)).toBeInTheDocument()
    expect(scan).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('sends the photo to the scan endpoint', async () => {
    const fetch = mockApi()
    renderApp('/scan')
    await choosePhoto()
    await screen.findByText(/Added to your payment/)
    const call = fetch.mock.calls.find(([url]) => url === '/api/receipts/scan')
    const body = call?.[1]?.body as FormData
    expect((body.get('file') as File).type).toBe('image/jpeg')
  })

  it.each([
    [413, 'The photo is too big. Please take a new one.'],
    [415, 'Please use a JPEG or PNG photo.'],
  ])('explains a rejected photo (%i) without a retry', async (status, message) => {
    mockApi({ scan: Response.json({ detail: 'rejected' }, { status }) })
    renderApp('/scan')
    await choosePhoto()
    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument()
  })

  it('offers a retry when the model fails (502)', async () => {
    mockApi({ scan: Response.json({ detail: 'model failed' }, { status: 502 }) })
    renderApp('/scan')
    await choosePhoto()
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not read the receipt. Please try again.')
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })

  it('renders right to left in Arabic', async () => {
    await i18n.changeLanguage('ar')
    renderApp('/scan')
    expect(document.documentElement.dir).toBe('rtl')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(i18n.t('scan.title'))
    expect(i18n.t('scan.title')).not.toBe('Scan a receipt')
  })

  it('has no accessibility violations', async () => {
    vi.spyOn(receipts, 'scanReceipt').mockResolvedValue(noMatch)
    const { container } = renderApp('/scan')
    await choosePhoto()
    await screen.findByText(/no payment matches/)
    const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })
    expect(results.violations.map((v) => v.id)).toEqual([])
  })
})
