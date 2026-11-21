import { describe, expect, it } from 'vitest'
import { formatDate } from './date'

describe('formatDate', () => {
  it('formats an ISO date as dd.mm.yyyy', () => {
    expect(formatDate('2025-11-21')).toBe('21.11.2025')
  })

  it('does not shift the day in any time zone', () => {
    expect(formatDate('2025-01-01')).toBe('01.01.2025')
  })
})
