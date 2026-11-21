const dateFormat = new Intl.DateTimeFormat('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })

/** Midnight UTC of an API date (YYYY-MM-DD), so the day never shifts with the device time zone. */
export const utc = (isoDate: string) => Date.parse(`${isoDate}T00:00:00Z`)

/** API date as dd.mm.yyyy, as in the PostFinance app (presentation only). */
export function formatDate(isoDate: string): string {
  return dateFormat.format(utc(isoDate))
}

/**
 * A period in words, in the UI language: "2025" for a full calendar year, otherwise months
 * ("January – November 2025"). Latin digits in every language, like the amounts.
 */
export function formatPeriod(start: string, end: string, language: string): string {
  const options = { timeZone: 'UTC', numberingSystem: 'latn' } as const
  if (start.endsWith('-01-01') && end.endsWith('-12-31') && start.slice(0, 4) === end.slice(0, 4)) {
    return new Intl.DateTimeFormat(language, { ...options, year: 'numeric' }).format(utc(start))
  }
  return new Intl.DateTimeFormat(language, { ...options, month: 'long', year: 'numeric' })
    .formatRange(utc(start), utc(end))
    .replace(/\s*[–-]\s*/, ' – ')
}
