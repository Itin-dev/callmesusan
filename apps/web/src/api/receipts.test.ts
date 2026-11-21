import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from './client'
import { scanReceipt } from './receipts'
import { LOLA_SCAN_FIXTURE } from './receipts.fixtures'

afterEach(() => vi.unstubAllGlobals())

const jpeg = new Blob(['jpeg bytes'], { type: 'image/jpeg' })

describe('scanReceipt', () => {
  it('posts the photo as multipart field "file" to /api/receipts/scan', async () => {
    const fetch = vi.fn(async () => Response.json(LOLA_SCAN_FIXTURE))
    vi.stubGlobal('fetch', fetch)

    expect(await scanReceipt(jpeg)).toEqual(LOLA_SCAN_FIXTURE)

    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('/api/receipts/scan')
    expect(init.method).toBe('POST')
    const file = (init.body as FormData).get('file') as File
    expect(file.name).toBe('receipt.jpg')
    expect(file.type).toBe('image/jpeg')
    expect(await file.text()).toBe('jpeg bytes')
  })

  it('fails with the HTTP status when the API rejects the photo', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ detail: 'too large' }, { status: 413 })))
    const error = await scanReceipt(jpeg).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(413)
  })
})
