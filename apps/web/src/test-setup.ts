import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
  // scanned receipts live in the session (features/scan/scannedReceipts.ts)
  sessionStorage.clear()
})
