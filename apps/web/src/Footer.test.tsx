import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Footer from './Footer'

const SHA = '0123456789abcdef0123456789abcdef01234567'

describe('Footer', () => {
  it('shows the short commit linked to GitHub', () => {
    render(<Footer commit={SHA} env="production" />)

    const link = screen.getByRole('link', { name: '0123456' })
    expect(link).toHaveAttribute(
      'href',
      `https://github.com/Itin-dev/aihackaton_test/commit/${SHA}`,
    )
  })

  it('labels non-production builds', () => {
    render(<Footer commit={SHA} env="preview" />)
    expect(screen.getByRole('contentinfo')).toHaveTextContent('preview')
  })

  it('does not label production builds', () => {
    render(<Footer commit={SHA} env="production" />)
    expect(screen.getByRole('contentinfo')).not.toHaveTextContent('production')
  })

  it('shows "dev" without a commit', () => {
    render(<Footer commit="" env="" />)
    expect(screen.getByRole('contentinfo')).toHaveTextContent('Version dev')
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
