const chf = new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' })
const plain = new Intl.NumberFormat('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// Browsers differ (’ vs '); the design uses the ASCII apostrophe.
const asciiApostrophe = (text: string) => text.replace(/[’‘]/g, "'")

/** Direction marker shown after the amount, as in the PostFinance app ("CHF 47.80–"). */
export type AmountDirection = 'credit' | 'debit'

/** Format an integer Rappen amount from the API as Swiss francs (presentation only). */
export function formatChf(amountRp: number, direction?: AmountDirection): string {
  const text = asciiApostrophe(chf.format(amountRp / 100)) // keeps the no-break space
  if (direction === 'credit') return `${text}+`
  if (direction === 'debit') return `${text}–`
  return text
}

/** Format an integer Rappen amount without the currency, as on a receipt line ("12.95"). */
export function formatAmount(amountRp: number): string {
  return asciiApostrophe(plain.format(amountRp / 100))
}

/** List amount without the currency and with a trailing sign, as in the account list ("64.35–"). */
export function formatSignedAmount(amountRp: number, direction: AmountDirection): string {
  return `${formatAmount(amountRp)}${direction === 'credit' ? '+' : '–'}`
}
