import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '@/App'
import { ThemeProvider } from '@/features/theme/ThemeProvider'
import i18n from '@/i18n'

function renderAt(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </MemoryRouter>,
  )
}

beforeEach(async () => {
  await i18n.changeLanguage('en')
})

describe('HomePage', () => {
  it('shows the product title', () => {
    renderAt()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Beyond the List')
  })

  it('offers the languages by their native names', () => {
    renderAt()
    const picker = screen.getByRole('group', { name: /language/i })
    for (const name of ['English', 'Deutsch', 'Українська', 'Русский', 'العربية']) {
      expect(within(picker).getByRole('button', { name })).toBeInTheDocument()
    }
  })

  it('translates the screen when a language is picked', async () => {
    renderAt()
    await userEvent.click(screen.getByRole('button', { name: 'Deutsch' }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Mehr als eine Liste')
    expect(screen.getByRole('button', { name: 'Deutsch' })).toHaveAttribute('aria-pressed', 'true')
    expect(document.documentElement).toHaveAttribute('lang', 'de')
  })

  it('switches the page to right-to-left for Arabic', async () => {
    renderAt()
    await userEvent.click(screen.getByRole('button', { name: 'العربية' }))
    expect(document.documentElement).toHaveAttribute('dir', 'rtl')
    expect(document.documentElement).toHaveAttribute('lang', 'ar')
  })

  it('has no detectable accessibility violations', async () => {
    const { container } = renderAt()
    const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })
    expect(results.violations.map((v) => v.id)).toEqual([])
  })
})
