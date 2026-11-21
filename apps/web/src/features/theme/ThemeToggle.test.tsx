import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { setSystemDark } from '@/test-setup'
import { ThemeProvider } from './ThemeProvider'
import { ThemeToggle } from './ThemeToggle'

function renderToggle() {
  return render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>,
  )
}

const html = document.documentElement

beforeEach(() => {
  localStorage.clear()
  html.classList.remove('dark')
  setSystemDark(false)
})

describe('ThemeToggle', () => {
  it('follows the system theme by default', () => {
    setSystemDark(true)
    renderToggle()
    expect(screen.getByRole('button', { name: /system/i })).toHaveAttribute('aria-pressed', 'true')
    expect(html).toHaveClass('dark')
  })

  it('switches to dark and back to light', async () => {
    renderToggle()
    await userEvent.click(screen.getByRole('button', { name: /dark/i }))
    expect(html).toHaveClass('dark')
    await userEvent.click(screen.getByRole('button', { name: /light/i }))
    expect(html).not.toHaveClass('dark')
  })

  it('remembers the choice on this device', async () => {
    const { unmount } = renderToggle()
    await userEvent.click(screen.getByRole('button', { name: /dark/i }))
    unmount()
    html.classList.remove('dark')
    renderToggle()
    expect(html).toHaveClass('dark')
  })
})
