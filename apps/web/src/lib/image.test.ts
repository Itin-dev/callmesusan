import { afterEach, describe, expect, it, vi } from 'vitest'
import { downscaleImage, fitWithin } from './image'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('fitWithin', () => {
  it('scales a landscape photo to 1600 px on the long side', () => {
    expect(fitWithin(4032, 3024)).toEqual({ width: 1600, height: 1200 })
  })

  it('scales a portrait photo to 1600 px on the long side', () => {
    expect(fitWithin(3024, 4032)).toEqual({ width: 1200, height: 1600 })
  })

  it('keeps a photo that is already small enough', () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 })
  })

  it('rounds to whole pixels', () => {
    expect(fitWithin(3000, 1999)).toEqual({ width: 1600, height: 1066 })
  })
})

describe('downscaleImage', () => {
  it('draws the photo at the fitted size and encodes it as JPEG', async () => {
    const bitmap = { width: 4000, height: 3000, close: vi.fn() }
    vi.stubGlobal('createImageBitmap', vi.fn(async () => bitmap))
    const drawImage = vi.fn()
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage } as never)
    const toBlob = vi
      .spyOn(HTMLCanvasElement.prototype, 'toBlob')
      .mockImplementation(function (this: HTMLCanvasElement, callback, type) {
        callback(new Blob([`${this.width}x${this.height}`], { type }))
      })

    const result = await downscaleImage(new File(['raw'], 'receipt.png', { type: 'image/png' }))

    expect(drawImage).toHaveBeenCalledWith(bitmap, 0, 0, 1600, 1200)
    expect(toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', expect.any(Number))
    expect(result.type).toBe('image/jpeg')
    expect(await result.text()).toBe('1600x1200')
    expect(bitmap.close).toHaveBeenCalled()
  })

  it('fails when the browser cannot encode the photo', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn(async () => ({ width: 10, height: 10, close: vi.fn() })))
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: vi.fn() } as never)
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => callback(null))

    await expect(downscaleImage(new Blob(['raw']))).rejects.toThrow()
  })
})
