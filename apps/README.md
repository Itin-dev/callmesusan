# apps/

Frontends. One app per subdirectory.

| App | Purpose |
| --- | --- |
| [`web/`](web/) | Psst mobile web app (Vite, React, TypeScript, Tailwind, shadcn/ui): Home, account detail, transaction with receipt, receipt scan, Analytics and the Psst chat |

Run it with `make web` (<http://localhost:5173>, proxies `/api` to the backend). Tests:
`npm --prefix apps/web test`. The app talks to the backend only through `/api/...`; see
[docs/stack.md](../docs/stack.md#frontend-ui).
