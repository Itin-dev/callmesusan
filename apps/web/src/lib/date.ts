const dateFormat = new Intl.DateTimeFormat('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })

/** Midnight UTC of an API date (YYYY-MM-DD), so the day never shifts with the device time zone. */
export const utc = (isoDate: string) => Date.parse(`${isoDate}T00:00:00Z`)

/** API date as dd.mm.yyyy, as in the PostFinance app (presentation only). */
export function formatDate(isoDate: string): string {
  return dateFormat.format(utc(isoDate))
}
