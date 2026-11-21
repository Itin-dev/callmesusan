import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as transcribe from '@/api/transcribe'
import i18n from '@/i18n'
import { mockApi, renderApp } from '@/test-utils'

beforeEach(async () => {
  await i18n.changeLanguage('en')
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

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

/** Browser recorder stand-in: stop() hands over one chunk of "audio", like a real MediaRecorder. */
class FakeRecorder {
  mimeType = 'audio/webm'
  ondataavailable: ((event: { data: Blob }) => void) | null = null
  onstop: (() => void) | null = null
  start() {}
  stop() {
    this.ondataavailable?.({ data: new Blob(['voice'], { type: 'audio/webm' }) })
    this.onstop?.()
  }
}

const stopTrack = vi.fn()
function stubMicrophone(getUserMedia = vi.fn(async () => ({ getTracks: () => [{ stop: stopTrack }] }))) {
  vi.stubGlobal('MediaRecorder', FakeRecorder)
  vi.stubGlobal('navigator', { ...navigator, mediaDevices: { getUserMedia } })
  return getUserMedia
}

describe('PsstChatPage voice', () => {
  beforeEach(() => mockApi())

  it('records a question and puts the text in the input without sending it', async () => {
    stubMicrophone()
    const scan = vi.spyOn(transcribe, 'transcribeAudio').mockResolvedValue('Where can I save?')
    renderApp('/psst')

    await userEvent.click(screen.getByRole('button', { name: 'Record your question' }))
    const stop = screen.getByRole('button', { name: 'Stop recording' })
    expect(stop).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(stop)

    await vi.waitFor(() => expect(input()).toHaveValue('Where can I save?'))
    expect(scan).toHaveBeenCalledWith(expect.any(Blob), 'en')
    expect((scan.mock.calls[0][0] as Blob).type).toBe('audio/webm')
    expect(stopTrack).toHaveBeenCalled()
    expect(within(log()).queryAllByRole('listitem')).toHaveLength(0)
    expect(input()).toHaveFocus()
  })

  it('shows that Psst is listening while the recording is read', async () => {
    stubMicrophone()
    vi.spyOn(transcribe, 'transcribeAudio').mockReturnValue(new Promise(() => {}))
    renderApp('/psst')
    await userEvent.click(screen.getByRole('button', { name: 'Record your question' }))
    await userEvent.click(screen.getByRole('button', { name: 'Stop recording' }))
    expect(await screen.findByRole('status')).toHaveTextContent('Psst is listening…')
    expect(screen.getByRole('button', { name: 'Record your question' })).toBeDisabled()
  })

  it('asks for the microphone when access is denied', async () => {
    stubMicrophone(vi.fn().mockRejectedValue(new DOMException('denied', 'NotAllowedError')))
    renderApp('/psst')
    await userEvent.click(screen.getByRole('button', { name: 'Record your question' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Allow the microphone to ask by voice.')
  })

  it('shows an error and sends the same recording again on retry', async () => {
    stubMicrophone()
    const scan = vi
      .spyOn(transcribe, 'transcribeAudio')
      .mockRejectedValueOnce(new Error('model down'))
      .mockResolvedValueOnce('And on coffee?')
    renderApp('/psst')
    await userEvent.click(screen.getByRole('button', { name: 'Record your question' }))
    await userEvent.click(screen.getByRole('button', { name: 'Stop recording' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Psst could not understand the recording.')
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await vi.waitFor(() => expect(input()).toHaveValue('And on coffee?'))
    expect(scan).toHaveBeenCalledTimes(2)
    expect(scan.mock.calls[1][0]).toBe(scan.mock.calls[0][0])
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('hides the mic when the browser cannot record', () => {
    renderApp('/psst')
    expect(screen.queryByRole('button', { name: 'Record your question' })).not.toBeInTheDocument()
  })

  it('sends the UI language and has no accessibility violations', async () => {
    await i18n.changeLanguage('ar')
    stubMicrophone()
    const scan = vi.spyOn(transcribe, 'transcribeAudio').mockResolvedValue('مرحبا')
    const { container } = renderApp('/psst')
    await userEvent.click(screen.getByRole('button', { name: i18n.t('chat.mic.start') }))
    await userEvent.click(screen.getByRole('button', { name: i18n.t('chat.mic.stop') }))
    await vi.waitFor(() => expect(screen.getByRole('textbox')).toHaveValue('مرحبا'))
    expect(scan).toHaveBeenCalledWith(expect.any(Blob), 'ar')
    expect(i18n.t('chat.mic.start')).not.toBe('Record your question')
    const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } })
    expect(results.violations.map((v) => v.id)).toEqual([])
  })
})
