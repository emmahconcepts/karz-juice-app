import { 
  int, 
  mysqlEnum, 
  mysqlTable, 
  text, 
  timestamp, 
  varchar,
  decimal,
  boolean,
  json,
  index
} from "drizzle-orm/mysql-core";

/**
 * MTN Mobile Money Transactions
 * Stores all transactions fetched from MTN API for reconciliation
 */
export const mtnTransactions = mysqlTable("mtn_transactions", {
  id: int("id").autoincrement().primaryKey(),
  
  // MTN transaction identifiers
  mtnTransactionId: varchar("mtnTransactionId", { length: 100 }).notNull().unique(),
  referenceId: varchar("referenceId", { length: 100 }),
  
  // Transaction details
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("UGX").notNull(),
  
  // Party information
  payerPhoneNumber: varchar("payerPhoneNumber", { length: 20 }).notNull(),
  payerName: text("payerName"),
  payeePhoneNumber: varchar("payeePhoneNumber", { length: 20 }),
  
  // Transaction metadata
  description: text("description"),
  transactionType: mysqlEnum("transactionType", ["payment", "reversal", "refund", "transfer"]).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed", "reversed"]).notNull(),
  
  // Reconciliation
  reconciliationStatus: mysqlEnum("reconciliationStatus", ["unmatched", "matched", "disputed", "confirmed"]).default("unmatched").notNull(),
  matchedLedgerId: int("matchedLedgerId"),
  matchedReceivableId: int("matchedReceivableId"),
  
  // Timestamps
  transactionDate: timestamp("transactionDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  
  // Sync tracking
  syncedAt: timestamp("syncedAt"),
  lastSyncError: text("lastSyncError"),
}, (table) => ({
  mtnIdIdx: index("mtn_id_idx").on(table.mtnTransactionId),
  phoneIdx: index("phone_idx").on(table.payerPhoneNumber),
  statusIdx: index("status_idx").on(table.reconciliationStatus),
  dateIdx: index("date_idx").on(table.transactionDate),
}));

export type MtnTransaction = typeof mtnTransactions.$inferSelect;
export type InsertMtnTransaction = typeof mtnTransactions.$inferInsert;

/**
 * MTN Reconciliation Rules
 * Define how to match MTN transactions to receivables/sales
 */
export const mtnReconciliationRules = mysqlTable("mtn_reconciliation_rules", {
  id: int("id").autoincrement().primaryKey(),
  
  // Rule configuration
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Matching criteria
  matchType: mysqlEnum("matchType", ["exact_amount", "amount_range", "phone_number", "reference_id", "custom"]).notNull(),
  amountMin: decimal("amountMin", { precision: 15, scale: 2 }),
  amountMax: decimal("amountMax", { precision: 15, scale: 2 }),
  phonePattern: varchar("phonePattern", { length: 255 }),
  referencePattern: varchar("referencePattern", { length: 255 }),
  
  // Action
  autoReconcile: boolean("autoReconcile").default(false).notNull(),
  autoCreateReceivable: boolean("autoCreateReceivable").default(false).notNull(),
  targetAccountId: int("targetAccountId"),
  
  // Status
  isActive: boolean("isActive").default(true).notNull(),
  priority: int("priority").default(100).notNull(),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MtnReconciliationRule = typeof mtnReconciliationRules.$inferSelect;
export type InsertMtnReconciliationRule = typeof mtnReconciliationRules.$inferInsert;

/**
 * MTN Sync History
 * Track when transactions were synced from MTN API
 */
export const mtnSyncHistory = mysqlTable("mtn_sync_history", {
  id: int("id").autoincrement().primaryKey(),
  
  // Sync details
  syncType: mysqlEnum("syncType", ["full", "incremental", "manual"]).notNull(),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "failed"]).notNull(),
  
  // Results
  transactionsFetched: int("transactionsFetched").default(0).notNull(),
  transactionsMatched: int("transactionsMatched").default(0).notNull(),
  transactionsCreated: int("transactionsCreated").default(0).notNull(),
  
  // Error tracking
  errorMessage: text("errorMessage"),
  errorDetails: json("errorDetails"),
  
  // Date range
  syncStartDate: timestamp("syncStartDate"),
  syncEndDate: timestamp("syncEndDate"),
  
  // Timestamps
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MtnSyncHistory = typeof mtnSyncHistory.$inferSelect;
export type InsertMtnSyncHistory = typeof mtnSyncHistory.$inferInsert;

/**
 * MTN Disputes
 * Track disputed transactions for manual review
 */
export const mtnDisputes = mysqlTable("mtn_disputes", {
  id: int("id").autoincrement().primaryKey(),
  
  // Transaction reference
  mtnTransactionId: varchar("mtnTransactionId", { length: 100 }).notNull(),
  
  // Dispute details
  reason: mysqlEnum("reason", ["amount_mismatch", "duplicate", "unauthorized", "service_issue", "other"]).notNull(),
  description: text("description").notNull(),
  
  // Status
  status: mysqlEnum("status", ["open", "investigating", "resolved", "rejected"]).default("open").notNull(),
  resolution: text("resolution"),
  
  // Tracking
  reportedBy: int("reportedBy").notNull(),
  resolvedBy: int("resolvedBy"),
  
  // Timestamps
  reportedAt: timestamp("reportedAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  mtnIdIdx: index("dispute_mtn_id_idx").on(table.mtnTransactionId),
  statusIdx: index("dispute_status_idx").on(table.status),
}));

export type MtnDispute = typeof mtnDisputes.$inferSelect;
export type InsertMtnDispute = typeof mtnDisputes.$inferInsert;

/**
 * MTN API Configuration
 * Stores MTN API settings and connection details
 */
export const mtnApiConfig = mysqlTable("mtn_api_config", {
  id: int("id").autoincrement().primaryKey(),
  
  // API settings
  environment: mysqlEnum("environment", ["sandbox", "production"]).default("sandbox").notNull(),
  apiBaseUrl: varchar("apiBaseUrl", { length: 255 }).notNull(),
  
  // Credentials (encrypted in production)
  apiKeyEncrypted: text("apiKeyEncrypted"),
  apiSecretEncrypted: text("apiSecretEncrypted"),
  collectionKeyEncrypted: text("collectionKeyEncrypted"),
  disbursementKeyEncrypted: text("disbursementKeyEncrypted"),
  
  // Configuration
  merchantId: varchar("merchantId", { length: 100 }),
  isEnabled: boolean("isEnabled").default(false).notNull(),
  
  // Sync settings
  autoSyncEnabled: boolean("autoSyncEnabled").default(true).notNull(),
  syncIntervalMinutes: int("syncIntervalMinutes").default(60).notNull(),
  lastSyncTime: timestamp("lastSyncTime"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MtnApiConfig = typeof mtnApiConfig.$inferSelect;
export type InsertMtnApiConfig = typeof mtnApiConfig.$inferInsert;
