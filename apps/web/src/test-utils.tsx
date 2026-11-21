import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { vi } from 'vitest'
import { TRANSACTION_FIXTURES } from '@/api/transactions.fixtures'
import type { TransactionDetail } from '@/api/types'
import App from '@/App'

/** Render the whole app at a route with fresh providers (no retries, no shared cache). */
export function renderApp(path = '/') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

/**
 * Stub fetch with the backend's answers for screen tests: GET /api/transactions/{id} from the
 * fixtures (404 otherwise). `transactions` overrides or adds single transactions.
 */
export function mockApi({ transactions = {} }: { transactions?: Record<string, TransactionDetail> } = {}) {
  const data = { ...TRANSACTION_FIXTURES, ...transactions }
  const fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    const match = url.match(/^\/api\/transactions\/([^/?]+)$/)
    const body = match ? data[decodeURIComponent(match[1])] : undefined
    return body
      ? Response.json(body)
      : Response.json({ detail: 'unknown transaction id' }, { status: 404 })
  })
  vi.stubGlobal('fetch', fetch)
  return fetch
}
