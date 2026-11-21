import { postForm } from './client'
import type { ScanResult } from './types'

/** Read a receipt photo (JPEG after downscaleImage) and find the payment it belongs to. */
export async function scanReceipt(photo: Blob): Promise<ScanResult> {
  const form = new FormData()
  form.append('file', photo, photo.type === 'image/png' ? 'receipt.png' : 'receipt.jpg')
  return postForm<ScanResult>('/api/receipts/scan', form)
}
