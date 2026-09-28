# TeesZone API

Fastify 5 backend for the TeesZone website — catalog, enquiries, newsletter and admin (Phase 2 of [PLAN.md](../PLAN.md)). Mirrors the structure/conventions of grass-api with the PLAN.md §4.2 stack: Zod validation (`fastify-type-provider-zod`), envalid config, `@fastify/jwt`, Prisma (migrations) + prisma-kysely + Kysely (queries), Redis (OTP cooldown + catalog cache), Resend email, S3 + sharp image uploads, Swagger at `/api/docs`.

## Setup

Requires Node 20+, MySQL 8 and Redis running locally (both installed via Homebrew on this machine).

```bash
cp .env.example .env        # fill DATABASE_URL / DB_PASSWORD (see below)
npm install                 # also runs prisma generate
npm run db:migrate          # creates the teeszone DB + tables
npm run db:seed             # seeds from ../ui/src/data (idempotent)
npm run dev                 # http://localhost:4010 — docs at /api/docs
```

> **Password gotcha:** special characters must be URL-encoded inside `DATABASE_URL` (`@` → `%40`) but stay raw in `DB_PASSWORD`.

> **Frontend builds need this API running** — `ui/` fetches products/collections during `next build` (SSG + ISR).

## Environment

| Var | Required | Notes |
|---|---|---|
| `PORT` | default 4010 | |
| `DATABASE_URL` | yes | Prisma (migrations); URL-encoded password |
| `DB_HOST/PORT/NAME/USERNAME/PASSWORD` | yes | Kysely pool (raw password) |
| `JWT_SECRET` | yes | admin JWTs (7-day) |
| `ADMIN_EMAILS` | yes | comma-separated allowlist for OTP login |
| `CORS_ORIGINS` | default `http://localhost:3000` | comma-separated |
| `REDIS_URL` | default `redis://localhost:6379` | degrades gracefully if down |
| `RESEND_API_KEY` | prod only | dev logs OTPs/enquiries to console |
| `MAIL_FROM`, `ENQUIRY_NOTIFY_EMAIL` | prod only | |
| `AWS_*`, `S3_BUCKET_NAME`, `S3_ENDPOINT` | prod only | upload returns 503 when unset |

Missing required vars fail fast at boot with a report naming each one (envalid).

## Data model notes

- **The FE contract is `ui/src/lib/types.ts`** — serializers in `src/services/catalog.service.ts` emit those shapes verbatim. Response Zod schemas strip undeclared fields, so any new field must be added to the schema too (`src/apis/products/products.schema.ts` → `productEntity`).
- **Virtual collections** (`new-arrival` / `best-sellers` / `mega-sale`) are flag-driven: `Product.isNew/bestSeller/megaSale` are the source of truth. They never get `ProductCollection` join rows; assignment attempts are rejected with 400. Toggle the flag instead.
- **Ordering is load-bearing** — `sortOrder` on segments/groups/collections/colors drives the mega menu and PDP breadcrumbs. Every list query orders explicitly.
- **Soft deletes** everywhere (`deletedAt`); public queries filter them.
- `prisma/seed.ts` imports `../../ui/src/data/*.ts` directly (type-only imports, run via `tsnd --transpile-only`) and is deliberately **excluded from tsconfig** — including it breaks `npm run build:tsc`.

## Curl cookbook

```bash
curl localhost:4010/api/health
curl localhost:4010/api/navigation
curl "localhost:4010/api/products?collection=best-sellers"
curl localhost:4010/api/products/classic-180-unisex-round-neck
curl -X POST localhost:4010/api/enquiries -H 'content-type: application/json' \
  -d '{"name":"Buyer","phone":"+919999999999","product":"executive-cotton-unisex-polo","quantity":"100 pcs"}'

# Admin login (OTP appears in server console when RESEND_API_KEY is unset)
curl -X POST localhost:4010/api/auth/request-otp -H 'content-type: application/json' -d '{"email":"madhan@revise.network"}'
curl -X POST localhost:4010/api/auth/verify-otp  -H 'content-type: application/json' -d '{"email":"madhan@revise.network","otp":"123456"}'

# Admin (Bearer token from verify-otp)
curl localhost:4010/api/enquiries -H "authorization: Bearer $TOKEN"
curl -X PATCH localhost:4010/api/enquiries/<id> -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' -d '{"status":"CONTACTED"}'
```

## Production

`npm run build:tsc` → `NODE_ENV=production node build/src/server.js` (or PM2). Run `npm run db:deploy` for migrations. `NODE_ENV=production` makes the mail/S3 vars required.

## Known dependency advisories

`npm audit` reports issues in `@fastify/static` (transitive via swagger-ui — docs UI only, no fix released yet) and dev-only tooling (`ts-node-dev` glob deps, prisma internals). Re-check after upstream releases.
