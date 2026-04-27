# ZaloCRM Frontend

Next.js 16 App Router frontend for a CRM SaaS tool. The app is structured to consume a NestJS API through feature-level service modules.

## Scripts

```bash
pnpm dev
pnpm lint
pnpm build
pnpm start
```

## Source Structure

```text
src/
  app/
    (dashboard)/       # authenticated CRM app routes
    (public)/          # public/auth routes
    layout.tsx         # root HTML shell
    page.tsx           # redirects to /dashboard
  components/          # reusable cross-feature UI
  config/              # app config and navigation
  features/            # domain modules
    auth/
    dashboard/
    app-shell/
  lib/
    api/               # typed NestJS API client
  types/               # shared TypeScript contracts
```

## NestJS API

Set the API base URL with one of these env vars:

```bash
NEST_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

Prefer `NEST_API_BASE_URL` for server-side calls. Keep endpoint wrappers inside each feature, for example `src/features/auth/api/auth-api.ts`.

## Development Rules

- Route files stay thin; feature logic lives under `src/features`.
- API calls go through `src/lib/api/api-client.ts`.
- Shared UI goes in `src/components`; domain UI stays in its feature.
- Add new CRM modules as `src/features/{module}/api`, `components`, `helpers`, `hooks`, and `types` when contracts are known.
