import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { vi } from 'vitest'
import { ACCOUNTS_FIXTURE } from '@/api/accounts.fixtures'
import { TRANSACTION_FIXTURES, TRANSACTION_LIST_FIXTURES } from '@/api/transactions.fixtures'
import type { AccountsOverview, ChatRequest, Transaction, TransactionAccount, TransactionDetail } from '@/api/types'
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
 * - GET /api/accounts answers `accounts` (default: the real response).
 * - GET /api/transactions?account= from the list fixtures; `lists` overrides an account's rows.
 * - GET /api/transactions/{id} from the fixtures (404 otherwise); `transactions` overrides or adds some.
 * - POST /api/chat answers with `chat(request)`: a reply string, or a Response (e.g. an error).
 */
export function mockApi({
  accounts = ACCOUNTS_FIXTURE,
  lists = {},
  transactions = {},
  chat = echoChat,
}: {
  accounts?: AccountsOverview
  lists?: Partial<Record<TransactionAccount, Transaction[]>>
  transactions?: Record<string, TransactionDetail>
  chat?: (request: ChatRequest) => string | Response | Promise<string | Response>
} = {}) {
  const data = { ...TRANSACTION_FIXTURES, ...transactions }
  const listData: Record<string, Transaction[]> = { ...TRANSACTION_LIST_FIXTURES, ...lists }
  const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    if (url === '/api/chat' && init?.method === 'POST') {
      const answer = await chat(JSON.parse(String(init.body)) as ChatRequest)
      return typeof answer === 'string' ? Response.json({ reply: answer }) : answer
    }
    if (url === '/api/accounts') return Response.json(accounts)
    const list = url.match(/^\/api\/transactions\?account=([^&]+)$/)
    if (list) {
      const rows = listData[decodeURIComponent(list[1])]
      return rows ? Response.json(rows) : Response.json({ detail: 'unknown account' }, { status: 422 })
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
