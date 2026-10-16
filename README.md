# TeesZone Backend API

High-performance Fastify 5 REST API for the **TeesZone** e-commerce and wholesale manufacturing platform — powering catalog, collections, authentication, user-isolated product likes, home CMS, reviews, customer inquiries, Razorpay payments, AWS S3 image storage, and admin operations.

- **Framework**: Fastify 5 + Zod Type Provider
- **Database & Query Layer**: MySQL 8 with Prisma (Migrations) & Kysely (Type-safe SQL Query Builder)
- **Cache**: Redis (Session & Catalog Caching)
- **Object Storage**: AWS S3 (Automated product & asset image uploads)
- **Payments**: Razorpay Orders & Signature Verification
- **Auth & Security**: JWT Authentication (`@fastify/jwt`) with Argon2 / SHA-256 password hashing & Role-Based Access Control (RBAC)
- **Documentation**: Swagger OpenAPI at `/api/docs`

---

## Architecture & API Modules

### 1. Catalog & Collections (`/api/products`, `/api/collections`)
- Multi-category management across **MEN**, **WOMEN**, **KIDS**, **HOODIES**, and **SPECIALTY & FABRICS**.
- GSM, fabric composition, color variants, size grids, and volume-tiered bulk pricing.
- Admin catalog management (`/api/products/admin/*`) with automatic AWS S3 image synchronization.

### 2. User-Isolated Product Likes (`/api/likes`)
- `GET /api/likes` — Fetches liked product slugs strictly for the authenticated user.
- `POST /api/likes/toggle` — Toggles product like/wishlist state in MySQL (`productlike` table).
- `GET /api/likes/admin/list` — Admin-only endpoint displaying which registered customers liked which products, along with contact details (email, phone, company) and timestamps.

### 3. Dynamic Homepage CMS (`/api/home-content`)
- `GET /api/home-content` — Public endpoint returning live homepage content (Hero Split, Shop By Range, The Fabric Library, The TeesZone Process).
- `PUT /api/home-content` — Protected admin endpoint enabling live text, banner, and background image updates across all storefront homepage sections.

### 4. Reviews & Orders Delivered (`/api/reviews`)
- Star ratings, verified customer testimonials, and live "Orders Delivered" counter per product.
- Admin endpoint for updating delivered orders metrics and managing reviews.

### 5. Payments & Inquiries (`/api/create-order`, `/api/enquiries`)
- Razorpay order creation and payment verification.
- Wholesale quote requests and customer contact inquiries.

---

## Security Features

1. **Role-Based Access Control (RBAC)**:
   - Admin routes (`/api/dashboard/*`, `/api/products/admin/*`, `/api/likes/admin/*`, `/api/home-content` [PUT], `/api/customers/*`, etc.) are protected by `adminMiddleware` requiring `ADMIN` role.
   - Non-admin or anonymous requests strictly return `401 Unauthorized` or `403 Forbidden`.
2. **Server-Side Secret Confinement**:
   - `JWT_SECRET`, `DATABASE_URL`, `AWS_SECRET_ACCESS_KEY`, and `RAZORPAY_KEY_SECRET` reside strictly in backend `.env` and are never exposed to client applications.
   - `.env` is protected via `.gitignore`.

---

## Getting Started

### 1. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure your MySQL (port 3308) and Redis services are active:
```env
PORT=4010
DATABASE_URL="mysql://root:password@localhost:3308/teeszone"
DB_HOST=localhost
DB_PORT=3308
DB_NAME=teeszone
DB_USERNAME=root
DB_PASSWORD=password
JWT_SECRET=your_jwt_secret_here
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=ap-south-1
AWS_BUCKET_NAME=your_s3_bucket
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...
ADMIN_EMAILS=teeszoneindia@gmail.com,vijayadarshini@teeszone.in,archana@teeszone.in,nithyasri@teeszone.in,vasuki@zavyx.in
```

### 2. Install Dependencies & Generate Prisma Client
```bash
npm install
npx prisma generate
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
The API server runs on [http://localhost:4010](http://localhost:4010).  
Swagger documentation is accessible at [http://localhost:4010/api/docs](http://localhost:4010/api/docs).

---

## Available Scripts

- `npm run dev` — Starts development server with hot-reload (`ts-node-dev`)
- `npm run build:tsc` — Compiles TypeScript to `build/`
- `npm run start` — Starts production server from `build/`
- `npm run db:migrate` — Runs Prisma migrations
- `npm run db:seed` — Seeds catalog, admin account, and collections
