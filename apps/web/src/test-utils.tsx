import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { vi } from 'vitest'
import { TRANSACTION_FIXTURES } from '@/api/transactions.fixtures'
import type { ChatRequest, TransactionDetail } from '@/api/types'
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

/** Default chat backend for tests: numbers its replies by the user turns it has seen. */
const echoChat = ({ messages }: ChatRequest) =>
  `Reply ${messages.filter((m) => m.role === 'user').length}: ${messages.at(-1)?.content}`

/**
 * Stub fetch with the backend's answers for screen tests:
 * - GET /api/transactions/{id} from the fixtures (404 otherwise); `transactions` overrides or adds some.
 * - POST /api/chat answers with `chat(request)`: a reply string, or a Response (e.g. an error).
 */
export function mockApi({
  transactions = {},
  chat = echoChat,
}: {
  transactions?: Record<string, TransactionDetail>
  chat?: (request: ChatRequest) => string | Response | Promise<string | Response>
} = {}) {
  const data = { ...TRANSACTION_FIXTURES, ...transactions }
  const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    if (url === '/api/chat' && init?.method === 'POST') {
      const answer = await chat(JSON.parse(String(init.body)) as ChatRequest)
      return typeof answer === 'string' ? Response.json({ reply: answer }) : answer
    }
    const match = url.match(/^\/api\/transactions\/([^/?]+)$/)
    const body = match ? data[decodeURIComponent(match[1])] : undefined
    return body
      ? Response.json(body)
      : Response.json({ detail: 'unknown transaction id' }, { status: 404 })
  })
  vi.stubGlobal('fetch', fetch)
  return fetch
}
