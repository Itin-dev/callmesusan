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
  it('offers the languages by their native names', () => {
    renderAt()
    const picker = screen.getByRole('group', { name: /language/i })
    for (const name of ['English', 'Deutsch', 'Українська', 'Русский', 'العربية']) {
      expect(within(picker).getByRole('button', { name })).toBeInTheDocument()
    }
  })

  it('shows the nine topic tiles as links', () => {
    renderAt()
    const topics = screen.getByRole('navigation', { name: /topics/i })
    expect(within(topics).getAllByRole('link')).toHaveLength(9)
    expect(within(topics).getByRole('link', { name: /urgent help/i })).toBeInTheDocument()
  })

  it('translates the screen when a language is picked', async () => {
    renderAt()
    await userEvent.click(screen.getByRole('button', { name: 'Deutsch' }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Hilfe in Luzern finden')
    expect(screen.getByRole('link', { name: /wohnen/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Deutsch' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('offers Russian', async () => {
    renderAt()
    await userEvent.click(screen.getByRole('button', { name: 'Русский' }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Найдите помощь в Люцерне')
    expect(document.documentElement).toHaveAttribute('lang', 'ru')
  })

  it('describes each topic in a short line', () => {
    renderAt()
    expect(screen.getByRole('link', { name: /housing/i })).toHaveTextContent(/find a flat/i)
  })

  it('switches the page to right-to-left for Arabic', async () => {
    renderAt()
    await userEvent.click(screen.getByRole('button', { name: 'العربية' }))
    expect(document.documentElement).toHaveAttribute('dir', 'rtl')
    expect(document.documentElement).toHaveAttribute('lang', 'ar')
  })

  it('opens the topic screen in the chosen language', async () => {
    renderAt()
    await userEvent.click(screen.getByRole('button', { name: 'Українська' }))
    await userEvent.click(screen.getByRole('link', { name: /житло/i }))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Житло')
    expect(screen.getByRole('link', { name: /назад/i })).toHaveAttribute('href', '/')
  })

  it('has no detectable accessibility violations', async () => {
    const { container } = renderAt()
    const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })
    expect(results.violations.map((v) => v.id)).toEqual([])
  })
})
