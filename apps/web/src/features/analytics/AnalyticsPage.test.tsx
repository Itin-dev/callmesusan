import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as spending from '@/api/spending'
import i18n from '@/i18n'
import { mockApi, renderApp } from '@/test-utils'

const NBSP = ' '
const QUESTION = 'Where does my money go each month?'

beforeEach(async () => {
  await i18n.changeLanguage('en')
  mockApi()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('AnalyticsPage', () => {
  it('opens from the Home Analysis quick action', async () => {
    renderApp()
    await userEvent.click(screen.getByRole('link', { name: 'Analysis' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Analytics' })).toBeInTheDocument()
  })

  it('tells the year in plain words, with money in and out from the API layer', async () => {
    renderApp('/analytics')
    expect(await screen.findByText(`In 2025 you earned CHF${NBSP}97'032 and spent CHF${NBSP}88'978.`)).toBeInTheDocument()
    expect(screen.getByText(`CHF${NBSP}7'415`)).toBeInTheDocument()
    expect(screen.getByText('per month on average')).toBeInTheDocument()
    const income = screen.getByText('Money in').closest('li')!
    expect(within(income).getByText(`CHF${NBSP}97'032.00`)).toBeInTheDocument()
    expect(within(income).getByText('13 payments')).toBeInTheDocument()
    const expenses = screen.getByText('Money out').closest('li')!
    expect(within(expenses).getByText(`CHF${NBSP}88'977.51`)).toBeInTheDocument()
    expect(within(expenses).getByText('461 payments')).toBeInTheDocument()
  })

  it('offers questions for Psst in a Psst card', async () => {
    renderApp('/analytics')
    const card = await screen.findByRole('region', { name: 'Psst… curious where your money goes?' })
    expect(within(card).getByRole('link', { name: 'What did I spend most on last month?' })).toHaveAttribute(
      'href',
      `/psst?q=${encodeURIComponent('What did I spend most on last month?')}`,
    )
  })

  it('asks Psst from the action row and the chat sends the question', async () => {
    renderApp('/analytics')
    const ask = await screen.findByRole('link', { name: 'Ask Psst' })
    expect(ask).toHaveAttribute('href', `/psst?q=${encodeURIComponent(QUESTION)}`)
    await userEvent.click(ask)
    expect(await screen.findByText(`Reply 1: ${QUESTION}`)).toBeInTheDocument()
  })

  it('shows a loading state, then an error with retry', async () => {
    const spy = vi.spyOn(spending, 'getSpendingSummary').mockRejectedValue(new Error('offline'))
    renderApp('/analytics')
    expect(screen.getByText('Loading…')).toBeInTheDocument()
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load the data.')

    spy.mockRestore()
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('Money in')).toBeInTheDocument()
  })

  it('renders right to left in Arabic with amounts kept left to right', async () => {
    await i18n.changeLanguage('ar')
    renderApp('/analytics')
    expect(document.documentElement.dir).toBe('rtl')
    expect(await screen.findByRole('heading', { level: 1, name: i18n.t('analytics.title') })).toBeInTheDocument()
    expect(await screen.findByText(`CHF${NBSP}97'032.00`)).toHaveAttribute('dir', 'ltr')
  })

  it('has no detectable accessibility violations', async () => {
    const { container } = renderApp('/analytics')
    await screen.findByText('Money in')
    const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })
    expect(results.violations.map((v) => v.id)).toEqual([])
  })
})
