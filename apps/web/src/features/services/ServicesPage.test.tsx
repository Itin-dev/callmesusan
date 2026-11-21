import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { beforeEach, describe, expect, it } from 'vitest'
import i18n from '@/i18n'
import { renderApp } from '@/test-utils'

beforeEach(async () => {
  await i18n.changeLanguage('en')
})

describe('ServicesPage', () => {
  it('offers the languages by their native names', () => {
    renderApp('/services')
    const picker = screen.getByRole('group', { name: 'Language' })
    for (const name of ['English', 'Deutsch', 'Українська', 'Русский', 'العربية']) {
      expect(within(picker).getByRole('button', { name })).toBeInTheDocument()
    }
  })

  it('translates the app when a language is picked', async () => {
    renderApp('/services')
    await userEvent.click(screen.getByRole('button', { name: 'Українська' }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Сервіси')
    expect(screen.getByRole('button', { name: 'Українська' })).toHaveAttribute('aria-pressed', 'true')
    expect(document.documentElement).toHaveAttribute('lang', 'uk')
  })

  it('switches the page to right-to-left for Arabic', async () => {
    renderApp('/services')
    await userEvent.click(screen.getByRole('button', { name: 'العربية' }))
    expect(document.documentElement).toHaveAttribute('dir', 'rtl')
  })

  it('shows the build version', () => {
    renderApp('/services')
    expect(screen.getByRole('contentinfo')).toHaveTextContent('Version')
  })

  it('has no detectable accessibility violations', async () => {
    const { container } = renderApp('/services')
    const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })
    expect(results.violations.map((v) => v.id)).toEqual([])
  })
})
