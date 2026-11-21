import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from './client'
import { transcribeAudio } from './transcribe'

afterEach(() => vi.unstubAllGlobals())

function stubFetch(response: Response) {
  const fetch = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => response)
  vi.stubGlobal('fetch', fetch)
  return fetch
}

describe('transcribeAudio', () => {
  it('posts the recording and the language to /api/transcribe and returns the text', async () => {
    const fetch = stubFetch(Response.json({ text: 'Where can I save?' }))
    const audio = new Blob(['abc'], { type: 'audio/webm' })

    await expect(transcribeAudio(audio, 'de')).resolves.toBe('Where can I save?')

    const [path, init] = fetch.mock.calls[0]
    expect(path).toBe('/api/transcribe')
    expect(init?.method).toBe('POST')
    const form = init?.body as FormData
    expect((form.get('file') as File).name).toBe('recording.webm')
    expect(form.get('language')).toBe('de')
  })

  it('names an MP4 recording (Safari) recording.mp4', async () => {
    const fetch = stubFetch(Response.json({ text: 'hi' }))
    await transcribeAudio(new Blob(['abc'], { type: 'audio/mp4' }), 'en')
    const form = fetch.mock.calls[0][1]?.body as FormData
    expect((form.get('file') as File).name).toBe('recording.mp4')
  })

  it('throws an ApiError when the API fails', async () => {
    stubFetch(Response.json({ detail: 'model failure' }, { status: 502 }))
    const error = await transcribeAudio(new Blob(['abc'], { type: 'audio/webm' }), 'en').catch((e) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(502)
  })
})
