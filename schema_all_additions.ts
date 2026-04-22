// ─────────────────────────────────────────────────────────────────────────────
// COMPLETE SCHEMA ADDITIONS
// Add all these tables to drizzle/schema.ts, then run: pnpm db:push
//
// Phases added:
//   Phase 9:  ecommerceOrders
//   Phase 12: mtnTransactions, mtnReconciliationRules, mtnSyncHistory, mtnDisputes, mtnApiConfig
//   Phase 13: email notification tables (see email-notifications-schema.ts)
//   Phase 14: receiptConfig, receipts, receiptPrintJobs, receiptQRLinks, printerConfig (see receipt-schema.ts)
//   Phase 16: pesapalTransactions, pesapalWebhooks, pesapalRefunds, pesapalSettings
//
// EXPENSE ENUM UPDATE — also update the `category` field in `expenses` table:
//   category: mysqlEnum("category", [
//     "general","machine_hire","vehicle_hire","utilities","ingredients",
//     "packaging_materials","wages_salaries"   // ← add these two
//   ]).notNull(),
// ─────────────────────────────────────────────────────────────────────────────

// Phase 9: E-Commerce Orders
export const ECOMMERCE_ORDERS_SQL = `
CREATE TABLE IF NOT EXISTS ecommerce_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orderRef VARCHAR(50) NOT NULL UNIQUE,
  customerName VARCHAR(255) NOT NULL,
  customerPhone VARCHAR(50) NOT NULL,
  deliveryLocation TEXT NOT NULL,
  flavour VARCHAR(100),
  items JSON NOT NULL,
  totalAmount DECIMAL(15,2) NOT NULL,
  status ENUM('pending','confirmed','delivered','cancelled') DEFAULT 'pending' NOT NULL,
  channel ENUM('web','whatsapp','call') DEFAULT 'web' NOT NULL,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT NOW() NOT NULL,
  updatedAt TIMESTAMP DEFAULT NOW() ON UPDATE NOW() NOT NULL
);`;

// All new schema files to include:
// - mtn-schema.ts         → 5 MTN tables
// - email-notifications-schema.ts → notification tables
// - receipt-schema.ts     → 5 receipt/printer tables
// - pesapal-schema.ts     → 4 PesaPal tables
