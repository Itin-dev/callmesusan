import type { CategorySpending, Receipt, SpendingByCategory } from './types'

/** A category counts as unusual from 1.5× its monthly average. */
const UNUSUAL_RATIO = 1.5

/**
 * Picks the receipt category that is most above its usual monthly spending.
 * Temporary: docs/mvp.md has no insight field yet; once the backend sends one, drop this.
 */
export function pickInsight(receipt: Receipt, spending: SpendingByCategory | undefined): CategorySpending | null {
  if (!spending) return null
  const onReceipt = new Set(receipt.category_totals.map((c) => c.category))
  const candidates = spending.categories
    .filter((c) => onReceipt.has(c.category) && c.ratio >= UNUSUAL_RATIO)
    .sort((a, b) => b.ratio - a.ratio)
  return candidates[0] ?? null
}
