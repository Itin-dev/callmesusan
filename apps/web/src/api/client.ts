/** Thin JSON client for the FastAPI backend. Paths stay relative (/api/...); Vite proxies them in dev. */
export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(path, { headers: { Accept: 'application/json' } })
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new ApiError(data?.detail ?? response.statusText, response.status)
  return data as T
}
