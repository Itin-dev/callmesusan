import { describe, expect, it } from 'vitest'
import { formatDate, formatPeriod } from './date'

describe('formatDate', () => {
  it('formats an ISO date as dd.mm.yyyy', () => {
    expect(formatDate('2025-11-21')).toBe('21.11.2025')
  })

  it('does not shift the day in any time zone', () => {
    expect(formatDate('2025-01-01')).toBe('01.01.2025')
  })
})

describe('formatPeriod', () => {
  it('shows only the year for a full calendar year', () => {
    expect(formatPeriod('2025-01-01', '2025-12-31', 'en')).toBe('2025')
  })

  it('shows months in words for a part of a year', () => {
    expect(formatPeriod('2025-01-01', '2025-11-21', 'en')).toBe('January – November 2025')
    expect(formatPeriod('2025-01-01', '2025-11-21', 'de')).toBe('Januar – November 2025')
  })

  it('keeps Latin digits in Arabic, like the amounts', () => {
    expect(formatPeriod('2025-01-01', '2025-12-31', 'ar')).toBe('2025')
  })
})
