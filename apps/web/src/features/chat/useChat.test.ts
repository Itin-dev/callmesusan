import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { mockApi } from '@/test-utils'
import { useChat } from './useChat'

const renderChat = () => renderHook(() => useChat())

const sentBodies = (fetch: ReturnType<typeof mockApi>) =>
  fetch.mock.calls.map(([, init]) => JSON.parse(String(init?.body)))

beforeEach(async () => {
  await i18n.changeLanguage('en')
})

afterEach(() => vi.unstubAllGlobals())

describe('useChat', () => {
  it('starts empty and idle', () => {
    mockApi()
    const { result } = renderChat()
    expect(result.current.messages).toEqual([])
    expect(result.current.status).toBe('idle')
  })

  it('shows the user message at once, then the reply', async () => {
    mockApi()
    const { result } = renderChat()
    act(() => result.current.send('  Where can I save?  '))
    expect(result.current.messages).toEqual([{ role: 'user', content: 'Where can I save?' }])
    expect(result.current.status).toBe('sending')

    await waitFor(() => expect(result.current.status).toBe('idle'))
    expect(result.current.messages.at(-1)).toEqual({ role: 'assistant', content: 'Reply 1: Where can I save?' })
  })

  it('sends the whole conversation and the UI language on every turn', async () => {
    await i18n.changeLanguage('de')
    const fetch = mockApi()
    const { result } = renderChat()
    act(() => result.current.send('Hallo'))
    await waitFor(() => expect(result.current.messages).toHaveLength(2))
    act(() => result.current.send('Und jetzt?'))
    await waitFor(() => expect(result.current.messages).toHaveLength(4))

    expect(sentBodies(fetch)).toEqual([
      { messages: [{ role: 'user', content: 'Hallo' }], language: 'de' },
      {
        messages: [
          { role: 'user', content: 'Hallo' },
          { role: 'assistant', content: 'Reply 1: Hallo' },
          { role: 'user', content: 'Und jetzt?' },
        ],
        language: 'de',
      },
    ])
  })

  it('ignores empty messages and messages sent while Psst is answering', async () => {
    const fetch = mockApi()
    const { result } = renderChat()
    act(() => result.current.send('   '))
    expect(fetch).not.toHaveBeenCalled()

    act(() => result.current.send('First'))
    act(() => result.current.send('Second'))
    await waitFor(() => expect(result.current.status).toBe('idle'))
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(result.current.messages.map((m) => m.content)).toEqual(['First', 'Reply 1: First'])
  })

  it('keeps the question on an error and retries the same conversation', async () => {
    let fail = true
    const fetch = mockApi({
      chat: ({ messages }) =>
        fail ? Response.json({ detail: 'LLM down' }, { status: 502 }) : `Reply ${messages.length}`,
    })
    const { result } = renderChat()
    act(() => result.current.send('Where can I save?'))
    await waitFor(() => expect(result.current.status).toBe('error'))
    expect(result.current.messages).toEqual([{ role: 'user', content: 'Where can I save?' }])

    fail = false
    act(() => result.current.retry())
    await waitFor(() => expect(result.current.status).toBe('idle'))
    expect(result.current.messages.at(-1)).toEqual({ role: 'assistant', content: 'Reply 1' })
    expect(sentBodies(fetch)[1]).toEqual(sentBodies(fetch)[0])
  })
})
