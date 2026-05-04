# ZaloMKT Backend

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
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/customers`
- `GET /api/customers`
- `GET /api/customers/:customerId`
- `POST /api/zalo-accounts`
- `GET /api/zalo-accounts`
- `GET /api/zalo-accounts/:accountId`
- `POST /api/messaging-campaigns`
- `GET /api/messaging-campaigns`
- `GET /api/messaging-campaigns/:campaignId`
- `POST /api/messaging-campaigns/:campaignId/dispatch`

## Environment

Create `.env` from `.env.example`, then replace `[YOUR-PASSWORD]` with the Supabase database password.

```bash
PORT=3000
API_PREFIX=api
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.dgflhdyhgoacafexhiej.supabase.co:5432/postgres
DATABASE_SSL=true
JWT_SECRET=[GENERATE-A-LONG-RANDOM-SECRET]
JWT_EXPIRES_IN_SECONDS=86400
AUTH_COOKIE_NAME=access_token
AUTH_COOKIE_SECURE=false
AUTH_COOKIE_SAME_SITE=strict
ADMIN_ID=bootstrap-admin
ADMIN_EMAIL=admin@example.com
ADMIN_NAME=System Admin
ADMIN_PASSWORD_HASH=[BCRYPT-HASH]
```

Environment variables are required. The app does not provide runtime fallbacks for missing `.env` values.

Admin login is bootstrapped from env until an admin table exists. Store a bcrypt hash in `ADMIN_PASSWORD_HASH`, not a plaintext password.

Generate a local hash:

```bash
node -e "const bcrypt=require('bcrypt'); bcrypt.hash(process.argv[1], 12).then(console.log)" "your-password"
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
pnpm run lint
pnpm exec mikro-orm debug
```

## Next Decisions

- Database: PostgreSQL, MongoDB, or other
- Auth: password login, invite-only, OAuth, or SSO
- Zalo integration: official API, browser automation, or npm package
- Bulk dispatch: BullMQ/Redis, simple worker, or external queue
