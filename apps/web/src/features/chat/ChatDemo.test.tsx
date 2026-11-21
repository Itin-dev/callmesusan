import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ChatDemo from './ChatDemo'

function mockFetch(response: Partial<Response> & { json?: () => Promise<unknown> }) {
  const fn = vi.fn().mockResolvedValue({ ok: true, ...response })
  vi.stubGlobal('fetch', fn)
  return fn
}

afterEach(() => vi.unstubAllGlobals())

describe('ChatDemo', () => {
  it('sends the message to the API and shows the reply', async () => {
    const fetch = mockFetch({ json: async () => ({ reply: 'Hi there' }) })
    render(<ChatDemo />)

    await userEvent.type(screen.getByLabelText(/message/i), 'Hello')
    await userEvent.click(screen.getByRole('button', { name: /send/i }))

    expect(await screen.findByText('Hi there')).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledWith('/api/chat', expect.objectContaining({ method: 'POST' }))
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({
      messages: [{ role: 'user', content: 'Hello' }],
      language: 'en',
    })
  })

  it('shows the API error detail', async () => {
    mockFetch({ ok: false, json: async () => ({ detail: 'OPENROUTER_API_KEY is not set' }) })
    render(<ChatDemo />)

    await userEvent.type(screen.getByLabelText(/message/i), 'Hello')
    await userEvent.click(screen.getByRole('button', { name: /send/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('OPENROUTER_API_KEY is not set')
  })

  it('does not send an empty message', () => {
    render(<ChatDemo />)
    expect(screen.getByRole('button', { name: /send/i })).toBeDisabled()
  })
})
