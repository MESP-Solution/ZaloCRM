# ZaloCRM Backend

NestJS backend scaffold for a customer-facing Zalo messaging tool.

## Current Scope

- Customer account boundary
- Customer login endpoint boundary
- Multiple Zalo account management
- Bulk messaging campaign boundary
- Pluggable Zalo provider port for later API/npm integration

The Zalo sender and real auth store are intentionally not mocked. They return clear `503` errors until the real provider, database, and auth rules are added.

## Structure

```text
src
├── common
│   ├── filters
│   └── validation
├── config
├── modules
│   ├── auth
│   ├── customers
│   ├── messaging-campaigns
│   ├── zalo-accounts
│   └── zalo-provider
├── app.controller.ts
├── app.module.ts
├── app.service.ts
└── main.ts
```

## API Prefix

Default prefix: `/api`

Available scaffold endpoints:

- `GET /api`
- `POST /api/customers`
- `GET /api/customers`
- `GET /api/customers/:customerId`
- `POST /api/auth/login`
- `POST /api/zalo-accounts`
- `GET /api/zalo-accounts`
- `GET /api/zalo-accounts/:accountId`
- `POST /api/messaging-campaigns`
- `GET /api/messaging-campaigns`
- `GET /api/messaging-campaigns/:campaignId`
- `POST /api/messaging-campaigns/:campaignId/dispatch`

## Environment

```bash
PORT=3000
API_PREFIX=api
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

## Project Setup

```bash
pnpm install
```

## Compile And Run

```bash
pnpm run start
pnpm run start:dev
pnpm run start:prod
```

## Validate

```bash
pnpm run build
pnpm run test
pnpm run test:e2e
```

## Next Decisions

- Database: PostgreSQL, MongoDB, or other
- Auth: password login, invite-only, OAuth, or SSO
- Zalo integration: official API, browser automation, or npm package
- Bulk dispatch: BullMQ/Redis, simple worker, or external queue
