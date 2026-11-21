import { describe, expect, it } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('keeps custom type-scale sizes next to text colours', () => {
    expect(cn('text-caption', 'text-muted-foreground')).toBe('text-caption text-muted-foreground')
  })

  it('lets a later custom size win over an earlier one', () => {
    expect(cn('text-small', 'text-caption')).toBe('text-caption')
  })
})
