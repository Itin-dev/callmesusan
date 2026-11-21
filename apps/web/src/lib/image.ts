/** Longest side of an uploaded photo: keeps receipts readable and the upload far below the 4 MB limit. */
export const MAX_PHOTO_SIDE = 1600

/** Size that fits within max × max and keeps the aspect ratio; never scales up. */
export function fitWithin(width: number, height: number, max = MAX_PHOTO_SIDE) {
  const scale = Math.min(1, max / Math.max(width, height))
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

/** Scale a photo down in the browser and encode it as JPEG before the upload. */
export async function downscaleImage(file: Blob, max = MAX_PHOTO_SIDE, quality = 0.85): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const { width, height } = fitWithin(bitmap.width, bitmap.height, max)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas 2D is not available')
  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not encode the photo'))),
      'image/jpeg',
      quality,
    ),
  )
}
