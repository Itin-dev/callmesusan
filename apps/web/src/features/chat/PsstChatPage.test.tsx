import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { mockApi, renderApp } from '@/test-utils'

beforeEach(async () => {
  await i18n.changeLanguage('en')
})

afterEach(() => vi.unstubAllGlobals())

const log = () => screen.getByRole('log', { name: 'Conversation with Psst' })
const input = () => screen.getByRole('textbox', { name: 'Message to Psst' })

describe('PsstChatPage', () => {
  it('shows the header, a greeting and suggested questions', () => {
    mockApi()
    renderApp('/psst')
    expect(screen.getByRole('heading', { level: 1, name: 'Psst' })).toBeInTheDocument()
    expect(screen.getByText('Just between us · reads only, never pays')).toBeInTheDocument()
    expect(within(log()).getByText(/Ask me anything about your money/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Where can I save?' })).toBeInTheDocument()
    expect(screen.getByText('Psst never moves money without your yes.')).toBeInTheDocument()
  })

  it('holds a conversation of several turns', async () => {
    const fetch = mockApi()
    renderApp('/psst')
    await userEvent.type(input(), 'Where can I save?{Enter}')
    expect(input()).toHaveValue('')
    expect(await within(log()).findByText('Reply 1: Where can I save?')).toBeInTheDocument()

    await userEvent.type(input(), 'And on coffee?')
    await userEvent.click(screen.getByRole('button', { name: 'Send' }))
    expect(await within(log()).findByText('Reply 2: And on coffee?')).toBeInTheDocument()

    const texts = within(log()).getAllByRole('listitem').map((li) => li.textContent)
    expect(texts).toEqual([
      'You: Where can I save?',
      'Psst: Reply 1: Where can I save?',
      'You: And on coffee?',
      'Psst: Reply 2: And on coffee?',
    ])
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('hides the suggestions once the conversation starts', async () => {
    mockApi()
    renderApp('/psst')
    await userEvent.click(screen.getByRole('button', { name: 'Where can I save?' }))
    expect(await within(log()).findByText('Reply 1: Where can I save?')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Can I afford a holiday in April?' })).not.toBeInTheDocument()
  })

  it('asks the question from a suggestion chip link (?q=) once', async () => {
    const fetch = mockApi()
    renderApp(`/psst?q=${encodeURIComponent('How can I spend less on chocolate?')}`)
    expect(await within(log()).findByText('Reply 1: How can I spend less on chocolate?')).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('shows that Psst is thinking and blocks a second send meanwhile', async () => {
    let answer: (reply: string) => void = () => {}
    mockApi({ chat: () => new Promise<string>((resolve) => (answer = resolve)) })
    renderApp('/psst')
    await userEvent.type(input(), 'Where can I save?{Enter}')
    expect(await screen.findByText('Psst is thinking…')).toBeInTheDocument()
    await userEvent.type(input(), 'Next')
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled()

    answer('Eating out is CHF 410 above your usual.')
    expect(await within(log()).findByText('Eating out is CHF 410 above your usual.')).toBeInTheDocument()
    expect(screen.queryByText('Psst is thinking…')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled()
  })

  it('shows an error and retries the same question', async () => {
    let fail = true
    mockApi({ chat: () => (fail ? Response.json({ detail: 'LLM down' }, { status: 502 }) : 'Here you go.') })
    renderApp('/psst')
    await userEvent.type(input(), 'Where can I save?{Enter}')
    expect(await screen.findByRole('alert')).toHaveTextContent('Psst could not answer. Please try again.')
    expect(within(log()).getByText('Where can I save?')).toBeInTheDocument()

    fail = false
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await within(log()).findByText('Here you go.')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('works in Arabic, right to left, and asks in Arabic', async () => {
    await i18n.changeLanguage('ar')
    const fetch = mockApi()
    renderApp('/psst')
    expect(document.documentElement.dir).toBe('rtl')
    await userEvent.type(screen.getByRole('textbox'), 'مرحبا{Enter}')
    await within(screen.getByRole('log')).findByText(/Reply 1/)
    expect(JSON.parse(String(fetch.mock.calls[0][1]?.body)).language).toBe('ar')
  })

  it('goes back to Home when opened directly', async () => {
    mockApi()
    renderApp('/psst')
    await userEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Home' })).toBeInTheDocument()
  })

  it('has no detectable accessibility violations', async () => {
    mockApi()
    const { container } = renderApp('/psst')
    await userEvent.type(input(), 'Where can I save?{Enter}')
    await within(log()).findByText(/Reply 1/)
    const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })
    expect(results.violations.map((v) => v.id)).toEqual([])
  })
})
