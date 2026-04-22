import { mysqlTable, varchar, decimal, timestamp, boolean, text, int, json } from "drizzle-orm/mysql-core";

export const pesapalTransactions = mysqlTable("pesapal_transactions", {
  id: int("id").primaryKey().autoincrement(),
  transactionId: varchar("transaction_id", { length: 100 }).unique().notNull(),
  orderId: varchar("order_id", { length: 100 }).notNull(),
  saleId: int("sale_id"),
  receivableId: int("receivable_id"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("UGX"),
  paymentMethod: varchar("payment_method", { length: 50 }), // card, mobile_money, bank_transfer
  paymentStatus: varchar("payment_status", { length: 50 }).default("pending"), // pending, completed, failed, cancelled
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerEmail: varchar("customer_email", { length: 255 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 20 }),
  description: text("description"),
  callbackUrl: text("callback_url"),
  redirectUrl: text("redirect_url"),
  pesapalReference: varchar("pesapal_reference", { length: 100 }),
  pesapalTrackingId: varchar("pesapal_tracking_id", { length: 100 }),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
  completedAt: timestamp("completed_at"),
});

export const pesapalWebhooks = mysqlTable("pesapal_webhooks", {
  id: int("id").primaryKey().autoincrement(),
  transactionId: varchar("transaction_id", { length: 100 }).notNull(),
  webhookType: varchar("webhook_type", { length: 50 }).notNull(), // payment_status_change, etc
  status: varchar("status", { length: 50 }).notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }),
  amount: decimal("amount", { precision: 12, scale: 2 }),
  currency: varchar("currency", { length: 3 }),
  pesapalReference: varchar("pesapal_reference", { length: 100 }),
  rawPayload: json("raw_payload"),
  processed: boolean("processed").default(false),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const pesapalRefunds = mysqlTable("pesapal_refunds", {
  id: int("id").primaryKey().autoincrement(),
  transactionId: varchar("transaction_id", { length: 100 }).notNull(),
  refundAmount: decimal("refund_amount", { precision: 12, scale: 2 }).notNull(),
  refundReason: text("refund_reason"),
  refundStatus: varchar("refund_status", { length: 50 }).default("pending"), // pending, completed, failed
  pesapalRefundId: varchar("pesapal_refund_id", { length: 100 }),
  requestedBy: varchar("requested_by", { length: 100 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const pesapalSettings = mysqlTable("pesapal_settings", {
  id: int("id").primaryKey().autoincrement(),
  consumerKey: varchar("consumer_key", { length: 255 }),
  consumerSecret: varchar("consumer_secret", { length: 255 }),
  apiUrl: varchar("api_url", { length: 255 }).default("https://api.pesapal.com"),
  webhookSecret: varchar("webhook_secret", { length: 255 }),
  isEnabled: boolean("is_enabled").default(false),
  isSandbox: boolean("is_sandbox").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export type PesapalTransaction = typeof pesapalTransactions.$inferSelect;
export type PesapalWebhook = typeof pesapalWebhooks.$inferSelect;
export type PesapalRefund = typeof pesapalRefunds.$inferSelect;
export type PesapalSettings = typeof pesapalSettings.$inferSelect;
