# TeesZone Backend API

High-performance Fastify 5 REST API for the TeesZone e-commerce platform — managing catalog, collections, authentication, customer inquiries, reviews, and admin operations.

- **Server**: Fastify 5 + Zod Type Provider
- **Database & ORM**: MySQL 8 with Prisma (Migrations) & Kysely (Query Builder)
- **Cache**: Redis (Session & Catalog Caching)
- **Auth**: JWT Authentication (`@fastify/jwt`) with Argon2 / SHA-256 password hashing
- **Documentation**: Swagger OpenAPI at `/api/docs`

---

## Recent Updates & Improvements

1. **Admin Authentication**:
   - Authorized Administrator Login: `teeszoneindia@gmail.com`
   - Default seeded credentials configured for `teeszoneindia@gmail.com` / `teeszone@2025`.

2. **Automated Catalog Pruning & Synchronization**:
   - `prisma/seed.ts` automatically aligns the MySQL database with storefront categories.
   - Idempotent cleanup script that removes deprecated collections/segments while preserving active products.
   - Resolved all TypeScript diagnostics with zero errors during seeding and compilation.

3. **Performance & Reliability**:
   - Sub-15ms core API response times.
   - Clean modular architecture under `src/apis/`.

---

## Getting Started

### 1. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure your MySQL database and Redis services are active, and update database credentials in `.env`:
```env
DATABASE_URL="mysql://root:password@localhost:3308/teeszone"
DB_HOST=localhost
DB_PORT=3308
DB_NAME=teeszone
DB_USERNAME=root
DB_PASSWORD=password
ADMIN_EMAILS=teeszoneindia@gmail.com
```

### 2. Install Dependencies & Generate Client
```bash
npm install
```

### 3. Database Migration & Seeding
```bash
npm run db:migrate
npm run db:seed
```

### 4. Run Development Server
```bash
npm run dev
```
API server runs on [http://localhost:4010](http://localhost:4010).  
Interactive Swagger documentation is available at [http://localhost:4010/api/docs](http://localhost:4010/api/docs).

---

## Available Scripts

- `npm run dev` — Starts development server with hot-reload (`ts-node-dev`)
- `npm run build:tsc` — Compiles TypeScript to `build/`
- `npm run start` — Starts production server from `build/`
- `npm run db:migrate` — Runs Prisma migrations
- `npm run db:seed` — Seeds catalog, admin account, and collections
