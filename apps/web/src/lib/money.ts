const chf = new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' })

/** Direction marker shown after the amount, as in the PostFinance app ("CHF 47.80–"). */
export type AmountDirection = 'credit' | 'debit'

/** Format an integer Rappen amount from the API as Swiss francs (presentation only). */
export function formatChf(amountRp: number, direction?: AmountDirection): string {
  // Browsers differ (’ vs '); the design uses the ASCII apostrophe. Keep the no-break space.
  const text = chf.format(amountRp / 100).replace(/[’‘]/g, "'")
  if (direction === 'credit') return `${text}+`
  if (direction === 'debit') return `${text}–`
  return text
}
