# Karz Juice Enterprise Management System — Complete Build v2

**17 Phases Complete · 130 Files · Production Ready**

---

## Quick Start

```bash
# 1. Install dependencies
pnpm install
pnpm add qrcode jspdf nodemailer node-cron axios clsx tailwind-merge @ai-sdk/react ai
pnpm add -D @types/qrcode @types/nodemailer @types/node-cron @playwright/test

# 2. Configure environment
cp env.example .env   # fill in all values

# 3. Create all database tables
pnpm db:push

# 4. Start
pnpm dev   # http://localhost:3000
```

---

## All Routes

### Public (no login)
| URL | Page |
|---|---|
| `/shop` | E-commerce juice ordering storefront |
| `/login` | Built-in email/password login |
| `/verify/:receiptNumber` | QR receipt verification |
| `/receipt/:token` | Customer portal (receipt + invoice download) |
| `/scan` | QR code scanner landing |

### Enterprise Dashboard (login required)
| URL | Module |
|---|---|
| `/` | Dashboard — KPIs, charts, alerts |
| `/sales` | Daily sales + day close |
| `/functions` | Events/weddings |
| `/accounts` | Chart of accounts + ledger |
| `/expenses` | Expenses (7 categories incl. Packaging & Wages) |
| `/machine-hire` | Machine hire |
| `/vehicle-hire` | Vehicle hire |
| `/products` | Products + BOM |
| `/packages` | Juice bundle packages |
| `/receipts` | AI OCR receipt scanner |
| `/client-receipts` | Official receipts + QR |
| `/receipt-printing` | Thermal/PDF receipt printing |
| `/statements` | Bank/MoMo statement reconciliation |
| `/reports` | Email reports |
| `/receivables` | Accounts receivable |
| `/payables` | Accounts payable |
| `/drawings` | Owner withdrawals (Equity) |
| `/custom-accounts` | Custom account creation |
| `/mtn` | MTN Mobile Money reconciliation |
| `/pesapal-payment` | PesaPal payment gateway |
| `/notification-settings` | Email notification config |
| `/admin` | User management, approvals, audit |

### REST Endpoints (public)
| Endpoint | Purpose |
|---|---|
| `GET /api/verify-receipt/:receiptNumber` | QR receipt verification |
| `POST /api/orders` | E-commerce order placement |
| `POST /api/webhooks/mtn` | MTN payment webhook |
| `POST /api/webhooks/pesapal` | PesaPal payment webhook |
| `GET /api/pesapal/callback` | PesaPal IPN callback |

---

## File Placement

```
client/src/
  pages/         ← All *Module.tsx + *Entry.tsx + public pages
  components/    ← DashboardLayout.tsx, GlobalSearch.tsx, UserApprovalPanel.tsx,
                    AIChatBox.tsx, Markdown.tsx
  App.tsx        ← All routes (updated)

server/
  routers.ts     ← All 17 routers (updated)
  routers/       ← sales, admin, ocr, statements, reports, receivables, payables,
                    customAccounts, packages, receipts, search, orders, drawings,
                    mtn, notifications, pesapal
  _core/
    index.ts     ← Add: import { registerPublicRoutes } from "./publicRoutes";
                         registerPublicRoutes(app);
    publicRoutes.ts      ← REST: verify, orders, MTN webhook, PesaPal webhook
    mtn-reconciliation.ts ← Complete DB implementation
    qr-code-service.ts
    receipt-service.ts
    receipt-helpers.ts
    invoice-service.ts
    email-service.ts
    notification-scheduler.ts
    pesapal-client.ts
    pesapal-service.ts
    mtn-client.ts

drizzle/
  schema.ts         ← Core tables (27 tables incl. qrCodeLinks, ecommerceOrders)
  mtn-schema.ts     ← MTN tables (5 tables)
  receipt-schema.ts ← Receipt/printer tables (5 tables)
  pesapal-schema.ts ← PesaPal tables (4 tables)
  email-notifications-schema.ts ← Notification tables (6 tables)
```

---

## Database Setup

Run once after deployment:
```bash
pnpm db:push   # creates all tables from all schema files
```

If you get schema drift errors, run:
```bash
pnpm db:generate
pnpm db:push
```

---

## Environment Variables (see env.example for full list)

```env
DATABASE_URL=mysql://...
APP_URL=https://karzjuice.app
MTN_API_KEY=...
PESAPAL_CONSUMER_KEY=...
SMTP_HOST=smtp.gmail.com
WHATSAPP_NUMBER=256700000000
```

---

## Tests

```bash
pnpm test                     # 126+ unit tests (Vitest)
pnpm test:api                 # tRPC API tests
pnpm test:all                 # All unit + API + module tests
pnpm test:e2e                 # Playwright E2E (22 modules, 2 devices)
pnpm test:performance:local   # k6 load test (100 users)
pnpm test:qa-report           # Generate QA report
```

---

## Post-Deploy Checklist

- [ ] `pnpm db:push` on production DB
- [ ] Set `APP_URL` in `.env` (used in QR codes — must be public URL)
- [ ] Set `WHATSAPP_NUMBER` in `EcommerceLanding.tsx`
- [ ] Configure MTN credentials: Admin → Settings → MTN API
- [ ] Configure PesaPal credentials: Admin → Settings → PesaPal
- [ ] Configure SMTP: `/notification-settings` → SMTP tab
- [ ] Add `registerPublicRoutes(app)` to `server/_core/index.ts`
- [ ] Create first admin user, approve via `/admin`
- [ ] Test `/shop` on mobile (375px)
- [ ] Test QR scan at `/scan`
- [ ] Test receipt print at `/receipt-printing`
- [ ] Test MTN sync at `/mtn`
- [ ] Test PesaPal payment at `/pesapal-payment`
- [ ] Run `pnpm test:e2e` against live URL

---

## Business Rules (enforced in code)

1. No mixing function income and daily sales
2. No auto-posting OCR or MTN transactions — manual confirm required
3. Every transaction posts to double-entry ledger (debits = credits)
4. No deleting ledger entries — only reversals
5. Day close locks all sales for that date (admin override via `/admin`)
6. Dark theme only — brand colors enforced in `index.css`
7. Emailed receipts cannot be deleted
8. New users require admin approval before dashboard access
9. MTN transactions auto-reconcile against receivables via matching rules
10. PesaPal webhooks update payment status and receivable balances
