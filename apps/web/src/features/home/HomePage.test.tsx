import { screen, within } from '@testing-library/react'
import axe from 'axe-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { mockApi, renderApp } from '@/test-utils'

beforeEach(async () => {
  await i18n.changeLanguage('en')
  mockApi()
})

afterEach(() => vi.unstubAllGlobals())

describe('HomePage', () => {
  it('renders inside the app shell with the tab bar', () => {
    renderApp()
    expect(screen.getByRole('heading', { level: 1, name: 'Home' })).toBeInTheDocument()
    const tabs = screen.getByRole('navigation', { name: 'Main navigation' })
    expect(within(tabs).getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page')
    for (const label of ['Payments', 'Invest', 'Offers', 'Services']) {
      expect(within(tabs).getByText(label)).toBeInTheDocument()
    }
  })

  it('opens the Psst chat from the quick action and the ask field', () => {
    renderApp()
    expect(screen.getByRole('link', { name: 'Psst' })).toHaveAttribute('href', '/psst')
    expect(screen.getByRole('link', { name: 'Type or speak…' })).toHaveAttribute('href', '/psst')
  })

  it('opens the chat with a suggested question', () => {
    renderApp()
    expect(screen.getByRole('link', { name: 'Where can I cut costs?' })).toHaveAttribute(
      'href',
      '/psst?q=Where%20can%20I%20cut%20costs%3F',
    )
  })

  it('shows account balances from the API layer', async () => {
    renderApp()
    expect(await screen.findByText('Private account')).toBeInTheDocument()
    expect(screen.getByText('CHF 4\'812.35+')).toBeInTheDocument()
    expect(screen.getByText('CHF 23\'480.00+')).toBeInTheDocument()
    expect(screen.getByText('Retirement savings')).toBeInTheDocument()
  })

  it('opens the account detail from every account row, including the credit card', async () => {
    renderApp()
    await screen.findByText('Credit card')
    const accounts = screen.getByRole('region', { name: 'Accounts and Investments' })
    const links = within(accounts).getAllByRole('link')
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/accounts/privat',
      '/accounts/savings',
      '/accounts/pillar3',
      '/accounts/kk',
    ])
    expect(within(links[3]).getByText('Credit card')).toBeInTheDocument()
  })

  it('has no detectable accessibility violations', async () => {
    const { container } = renderApp()
    await screen.findByText('Private account')
    const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })
    expect(results.violations.map((v) => v.id)).toEqual([])
  })
})
