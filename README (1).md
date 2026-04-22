# Karz Juice Enterprise Management System

**Stack:** React + TypeScript + Vite (PWA) · tRPC · Drizzle ORM · MySQL · Express · Playwright · k6

---

## Quick Start

```bash
# 1. Install dependencies
pnpm install
pnpm add qrcode
pnpm add -D @types/qrcode @playwright/test

# 2. Copy environment file
cp .env.example .env
# Fill in: DATABASE_URL, APP_URL, OWNER_OPEN_ID

# 3. Push schema to database
pnpm db:push

# 4. Start development server
pnpm dev
# App: http://localhost:3000
# Shop: http://localhost:3000/shop
# Admin: http://localhost:3000/admin
```

---

## Environment Variables

```env
DATABASE_URL=mysql://user:pass@host:3306/karzjuice
APP_URL=https://karzjuice.app
OWNER_OPEN_ID=your-oauth-owner-id
NODE_ENV=development
```

---

## Project Structure

```
├── client/src/
│   ├── pages/             # All page components (20 modules)
│   ├── components/        # Shared UI (DashboardLayout, GlobalSearch, etc.)
│   └── lib/               # trpc client, qrcode utility
├── server/
│   ├── _core/             # Express setup, tRPC context, auth
│   ├── routers/           # All tRPC routers (14 routers)
│   └── db.ts              # Drizzle ORM helpers
├── drizzle/
│   └── schema.ts          # Complete database schema (27 tables)
└── tests/
    ├── e2e.test.ts         # Playwright E2E (20 modules)
    ├── api.test.ts         # tRPC API tests
    └── performance.k6.js   # k6 load test (100 users)
```

---

## Available Pages

| Route | Description | Auth |
|---|---|---|
| `/` | Organization Dashboard | ✅ Required |
| `/sales` | Daily Sales + Day Close | ✅ Required |
| `/functions` | Events & Weddings | ✅ Required |
| `/accounts` | Chart of Accounts + Ledger | ✅ Required |
| `/expenses` | Expenses (7 categories) | ✅ Required |
| `/machine-hire` | Machine hire tracking | ✅ Required |
| `/vehicle-hire` | Vehicle hire tracking | ✅ Required |
| `/products` | Products + BOM | ✅ Required |
| `/packages` | Juice bundle packages | ✅ Required |
| `/receipts` | AI OCR receipt scanning | ✅ Required |
| `/client-receipts` | Official receipts + QR | ✅ Required |
| `/statements` | Bank/MoMo statement import | ✅ Required |
| `/reports` | Email reports | ✅ Required |
| `/receivables` | Accounts receivable | ✅ Required |
| `/payables` | Accounts payable | ✅ Required |
| `/drawings` | Owner withdrawals | ✅ Admin/Finance |
| `/custom-accounts` | Custom account creation | ✅ Admin/Finance |
| `/admin` | User management + approvals | ✅ Admin only |
| `/shop` | Public e-commerce storefront | ❌ Public |
| `/login` | Built-in login page | ❌ Public |
| `/verify/:id` | QR receipt verification | ❌ Public |

---

## Running Tests

```bash
# Unit tests (Vitest) — 150+ tests
pnpm test

# API tests
pnpm test:api

# New module tests
pnpm test:packages
pnpm test:receipts
pnpm test:search
pnpm test:delete-audit

# All unit + API tests
pnpm test:all

# E2E tests (Playwright) — requires running server
pnpm test:e2e
pnpm test:e2e:headed   # with browser visible

# Performance test (k6) — requires k6 installed
pnpm test:performance:local

# Generate QA report
pnpm test:qa-report
```

---

## Deployment

### Via GitHub Actions (recommended)
Push to `main` → CI runs tests → builds → deploys to production.
Push to `develop` → CI runs tests → deploys to staging.

Required GitHub Secrets:
- `DATABASE_URL` — production MySQL connection string
- `TEST_ADMIN_EMAIL` / `TEST_ADMIN_PASSWORD` — E2E test credentials
- `STAGING_URL` — staging deployment URL
- `APP_URL` — production URL (used in QR codes)

### Manual
```bash
pnpm build
node dist/server/index.js
```

---

## Key Business Rules (Non-Negotiable)

1. **No mixing** function income and daily sales
2. **No auto-posting** OCR data — manual confirmation required
3. **Every transaction** posts to the double-entry ledger
4. **No deleting** ledger entries — only reversals
5. **Day close** locks sales (admin override available)
6. **Dark theme only** — brand colors: Orange #FF9800, Green #0B6623, Red #D32F2F
7. **Receipts emailed** cannot be deleted
8. **New users** require admin approval before access

---

## Whatsapp Order Number
Update `WHATSAPP_NUMBER` in `EcommerceLanding.tsx`:
```tsx
const WHATSAPP_NUMBER = "256700000000"; // ← change to real number
```

---

## Post-Deployment Checklist

- [ ] Set `APP_URL` in `.env` to production domain (used in QR codes)
- [ ] Set `WHATSAPP_NUMBER` in `EcommerceLanding.tsx`
- [ ] Run `pnpm db:push` against production database
- [ ] Create first admin user and set `OWNER_OPEN_ID`
- [ ] Test `/shop` on mobile (375px viewport)
- [ ] Test QR code scan at `/verify/RCP-...`
- [ ] Send a test receipt email
- [ ] Run `pnpm test:e2e` against production URL
- [ ] Run k6 load test against staging: `pnpm test:performance:local`
