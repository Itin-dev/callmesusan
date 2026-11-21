import { afterEach, describe, expect, it, vi } from 'vitest'
import { LOLA_SCAN_FIXTURE } from '@/api/receipts.fixtures'
import { forgetScans, rememberScan, scannedReceiptFor, scannedReceipts } from './scannedReceipts'

const lola = LOLA_SCAN_FIXTURE.receipt

afterEach(() => vi.restoreAllMocks())

describe('scannedReceipts', () => {
  it('starts empty', () => {
    expect(scannedReceipts()).toEqual([])
    expect(scannedReceiptFor('P-0236')).toBeNull()
  })

  it('remembers a scan with its payment for the session', () => {
    rememberScan('P-0236', lola)
    expect(scannedReceiptFor('P-0236')).toEqual(lola)
    expect(scannedReceipts()).toEqual([{ ...lola, transaction_id: 'P-0236' }])
    expect(JSON.parse(sessionStorage.getItem('psst.scannedReceipts') ?? '[]')).toHaveLength(1)
  })

  it('keeps a scan without a payment for the chat', () => {
    rememberScan(null, lola)
    expect(scannedReceipts()).toEqual([{ ...lola, transaction_id: null }])
  })

  it('replaces an earlier scan of the same payment', () => {
    rememberScan('P-0236', lola)
    const again = { ...lola, receipt_id: 'LOLA-20251121-other' }
    rememberScan('P-0236', again)
    expect(scannedReceipts()).toEqual([{ ...again, transaction_id: 'P-0236' }])
  })

  it('forgets every scan, so the same receipt can be scanned again', () => {
    rememberScan('P-0236', lola)
    rememberScan(null, { ...lola, receipt_id: 'R-other' })
    forgetScans()
    expect(scannedReceipts()).toEqual([])
    expect(scannedReceiptFor('P-0236')).toBeNull()
    expect(sessionStorage.getItem('psst.scannedReceipts')).toBeNull()
  })

  it('keeps the last 10 scans, as many as the chat accepts', () => {
    for (let n = 0; n < 12; n++) rememberScan(`P-${n}`, { ...lola, receipt_id: `R-${n}` })
    const ids = scannedReceipts().map((r) => r.transaction_id)
    expect(ids).toHaveLength(10)
    expect(ids[0]).toBe('P-2')
    expect(ids.at(-1)).toBe('P-11')
  })

  it('still works for this page view when the browser blocks storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    rememberScan('P-0236', lola)
    expect(scannedReceiptFor('P-0236')).toEqual(lola)
  })
})
