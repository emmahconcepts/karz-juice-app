import {
  int, 
  mysqlEnum, 
  mysqlTable, 
  text, 
  timestamp, 
  varchar,
  decimal,
  date,
  boolean,
  json,
  longtext,
  index
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Roles: admin (full system), finance (accounts/OCR/reports), operations (sales/production/hires)
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "finance", "operations"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Organization settings (single org for MVP)
 */
export const organization = mysqlTable("organization", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Organization = typeof organization.$inferSelect;
export type InsertOrganization = typeof organization.$inferInsert;

/**
 * Chart of Accounts - Core account types
 * Cash, Mobile Money, Function Accounts (auto-generated), Expense Clearing
 */
export const accounts = mysqlTable("accounts", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["asset", "liability", "equity", "income", "expense"]).notNull(),
  category: mysqlEnum("category", ["cash", "mobile_money", "function", "clearing", "other"]).notNull(),
  description: text("description"),
  balance: decimal("balance", { precision: 15, scale: 2 }).default("0").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = typeof accounts.$inferInsert;

/**
 * General Ledger - Every transaction hits the ledger
 * Debits = Credits always (double-entry bookkeeping)
 * No deletion, only reversals
 */
export const ledgerEntries = mysqlTable("ledger_entries", {
  id: int("id").autoincrement().primaryKey(),
  transactionId: varchar("transactionId", { length: 100 }).notNull().unique(),
  debitAccountId: int("debitAccountId").notNull(),
  creditAccountId: int("creditAccountId").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  description: text("description"),
  entryDate: date("entryDate").notNull(),
  entryType: mysqlEnum("entryType", [
    "sales", "function_income", "expense", "payment", "transfer", 
    "reversal", "adjustment", "hire_cost"
  ]).notNull(),
  isReversed: boolean("isReversed").default(false).notNull(),
  reversedBy: varchar("reversedBy", { length: 100 }),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LedgerEntry = typeof ledgerEntries.$inferSelect;
export type InsertLedgerEntry = typeof ledgerEntries.$inferInsert;

/**
 * Daily Sales - Sales only (NOT function income)
 * Cannot edit after day close (admin override available)
 */
export const dailySales = mysqlTable("daily_sales", {
  id: int("id").autoincrement().primaryKey(),
  saleDate: date("saleDate").notNull(),
  productId: int("productId").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 15, scale: 2 }).notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["cash", "mobile_money"]).notNull(),
  recordedBy: int("recordedBy").notNull(),
  ledgerEntryId: varchar("ledgerEntryId", { length: 100 }),
  isClosed: boolean("isClosed").default(false).notNull(),
  closedAt: timestamp("closedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DailySale = typeof dailySales.$inferSelect;
export type InsertDailySale = typeof dailySales.$inferInsert;

/**
 * Products - Juice products with BOM
 */
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  sku: varchar("sku", { length: 100 }).notNull().unique(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

/**
 * Bill of Materials (BOM) - Per product cost structure
 */
export const bom = mysqlTable("bom", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  fruitQty: decimal("fruitQty", { precision: 10, scale: 2 }).notNull(),
  sugarQty: decimal("sugarQty", { precision: 10, scale: 2 }).notNull(),
  waterLiters: decimal("waterLiters", { precision: 10, scale: 2 }).notNull(),
  bottleType: varchar("bottleType", { length: 100 }).notNull(),
  laborCost: decimal("laborCost", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BOM = typeof bom.$inferSelect;
export type InsertBOM = typeof bom.$inferInsert;

/**
 * Production Batches - Track production runs
 */
export const productionBatches = mysqlTable("production_batches", {
  id: int("id").autoincrement().primaryKey(),
  batchNumber: varchar("batchNumber", { length: 100 }).notNull().unique(),
  productId: int("productId").notNull(),
  quantityProduced: decimal("quantityProduced", { precision: 10, scale: 2 }).notNull(),
  totalCost: decimal("totalCost", { precision: 15, scale: 2 }).notNull(),
  costPerUnit: decimal("costPerUnit", { precision: 10, scale: 2 }).notNull(),
  machineHireId: int("machineHireId"),
  productionDate: date("productionDate").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProductionBatch = typeof productionBatches.$inferSelect;
export type InsertProductionBatch = typeof productionBatches.$inferInsert;

/**
 * Functions (Events/Weddings) - Each function = its own account
 * Status: Paid, Partial, Overdue
 */
export const functions = mysqlTable("functions", {
  id: int("id").autoincrement().primaryKey(),
  functionAccountId: int("functionAccountId").notNull(),
  clientName: varchar("clientName", { length: 255 }).notNull(),
  eventType: varchar("eventType", { length: 100 }).notNull(),
  eventDate: date("eventDate").notNull(),
  contractAmount: decimal("contractAmount", { precision: 15, scale: 2 }).notNull(),
  depositPaid: decimal("depositPaid", { precision: 15, scale: 2 }).default("0").notNull(),
  balanceRemaining: decimal("balanceRemaining", { precision: 15, scale: 2 }).notNull(),
  paymentSchedule: json("paymentSchedule"),
  status: mysqlEnum("status", ["paid", "partial", "overdue"]).default("partial").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Function = typeof functions.$inferSelect;
export type InsertFunction = typeof functions.$inferInsert;

/**
 * Function Payments - Track payments for functions
 * Only reflected in Function Ledger, NOT daily sales
 */
export const functionPayments = mysqlTable("function_payments", {
  id: int("id").autoincrement().primaryKey(),
  functionId: int("functionId").notNull(),
  amountPaid: decimal("amountPaid", { precision: 15, scale: 2 }).notNull(),
  paymentDate: date("paymentDate").notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["cash", "mobile_money"]).notNull(),
  ledgerEntryId: varchar("ledgerEntryId", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FunctionPayment = typeof functionPayments.$inferSelect;
export type InsertFunctionPayment = typeof functionPayments.$inferInsert;

/**
 * Expenses - Tracked by category
 * Categories: General, Machine Hire, Vehicle Hire, Utilities, Ingredients
 */
export const expenses = mysqlTable("expenses", {
  id: int("id").autoincrement().primaryKey(),
  expenseDate: date("expenseDate").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  category: mysqlEnum("category", [
    "general", "machine_hire", "vehicle_hire", "utilities", "ingredients"
  ]).notNull(),
  accountId: int("accountId").notNull(),
  receiptId: int("receiptId"),
  ledgerEntryId: varchar("ledgerEntryId", { length: 100 }),
  description: text("description"),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

/**
 * Machine Hire - Track hired machines (external owners)
 * Cost Type: Daily or Per Job
 */
export const machineHires = mysqlTable("machine_hires", {
  id: int("id").autoincrement().primaryKey(),
  machineName: varchar("machineName", { length: 255 }).notNull(),
  ownerName: varchar("ownerName", { length: 255 }).notNull(),
  costType: mysqlEnum("costType", ["daily", "per_job"]).notNull(),
  hirePeriodStart: date("hirePeriodStart").notNull(),
  hirePeriodEnd: date("hirePeriodEnd"),
  costAmount: decimal("costAmount", { precision: 15, scale: 2 }).notNull(),
  linkedProductionBatchId: int("linkedProductionBatchId"),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "partial", "paid"]).default("pending").notNull(),
  ledgerEntryId: varchar("ledgerEntryId", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MachineHire = typeof machineHires.$inferSelect;
export type InsertMachineHire = typeof machineHires.$inferInsert;

/**
 * Vehicle Hire - Track vehicle rentals
 * Purpose: Delivery, Function, Sourcing
 */
export const vehicleHires = mysqlTable("vehicle_hires", {
  id: int("id").autoincrement().primaryKey(),
  vehicleOwnerName: varchar("vehicleOwnerName", { length: 255 }).notNull(),
  purpose: mysqlEnum("purpose", ["delivery", "function", "sourcing"]).notNull(),
  hirePeriodStart: date("hirePeriodStart").notNull(),
  hirePeriodEnd: date("hirePeriodEnd"),
  cost: decimal("cost", { precision: 15, scale: 2 }).notNull(),
  fuelIncluded: boolean("fuelIncluded").default(false).notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["cash", "mobile_money"]).notNull(),
  ledgerEntryId: varchar("ledgerEntryId", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VehicleHire = typeof vehicleHires.$inferSelect;
export type InsertVehicleHire = typeof vehicleHires.$inferInsert;

/**
 * Receipts - OCR and manual receipt tracking
 * Supports: PNG, JPG, PDF
 */
export const receipts = mysqlTable("receipts", {
  id: int("id").autoincrement().primaryKey(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileType: varchar("fileType", { length: 50 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }),
  extractedDate: date("extractedDate"),
  vendor: varchar("vendor", { length: 255 }),
  category: varchar("category", { length: 100 }),
  incomeOrExpense: mysqlEnum("incomeOrExpense", ["income", "expense"]),
  accountId: int("accountId"),
  confidenceScore: decimal("confidenceScore", { precision: 5, scale: 2 }),
  extractedData: json("extractedData"),
  isConfirmed: boolean("isConfirmed").default(false).notNull(),
  confirmedBy: int("confirmedBy"),
  linkedExpenseId: int("linkedExpenseId"),
  linkedFunctionPaymentId: int("linkedFunctionPaymentId"),
  uploadedBy: int("uploadedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Receipt = typeof receipts.$inferSelect;
export type InsertReceipt = typeof receipts.$inferInsert;

/**
 * Statements - Bank/Mobile Money statements for reconciliation
 * Supported: Mobile Money PDFs, Bank PDFs/CSV, Screenshots
 */
export const statements = mysqlTable("statements", {
  id: int("id").autoincrement().primaryKey(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileType: varchar("fileType", { length: 50 }).notNull(),
  accountId: int("accountId").notNull(),
  statementDate: date("statementDate").notNull(),
  uploadedBy: int("uploadedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Statement = typeof statements.$inferSelect;
export type InsertStatement = typeof statements.$inferInsert;

/**
 * Statement Transactions - Extracted transactions from statements
 * Status: Matched, Unmatched, Confirmed
 */
export const statementTransactions = mysqlTable("statement_transactions", {
  id: int("id").autoincrement().primaryKey(),
  statementId: int("statementId").notNull(),
  transactionDate: date("transactionDate").notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  type: mysqlEnum("type", ["debit", "credit"]).notNull(),
  status: mysqlEnum("status", ["matched", "unmatched", "confirmed"]).default("unmatched").notNull(),
  matchedLedgerEntryId: varchar("matchedLedgerEntryId", { length: 100 }),
  confirmedBy: int("confirmedBy"),
  confirmedAt: timestamp("confirmedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StatementTransaction = typeof statementTransactions.$inferSelect;
export type InsertStatementTransaction = typeof statementTransactions.$inferInsert;

/**
 * Offline Sync Queue - For PWA offline mode
 * Stores pending transactions for sync when online
 */
export const offlineSyncQueue = mysqlTable("offline_sync_queue", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: mysqlEnum("action", [
    "record_sale", "record_expense", "upload_receipt", "create_function_payment"
  ]).notNull(),
  payload: json("payload").notNull(),
  status: mysqlEnum("status", ["pending", "synced", "failed"]).default("pending").notNull(),
  conflictResolution: mysqlEnum("conflictResolution", ["last_confirmed_wins", "manual_review"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  syncedAt: timestamp("syncedAt"),
});

export type OfflineSyncQueue = typeof offlineSyncQueue.$inferSelect;
export type InsertOfflineSyncQueue = typeof offlineSyncQueue.$inferInsert;

/**
 * Email Reports - Scheduled automated reports
 * Weekly summary, Monthly performance
 */
export const emailReports = mysqlTable("email_reports", {
  id: int("id").autoincrement().primaryKey(),
  reportType: mysqlEnum("reportType", ["weekly", "monthly"]).notNull(),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  lastSentAt: timestamp("lastSentAt"),
  nextScheduledAt: timestamp("nextScheduledAt"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailReport = typeof emailReports.$inferSelect;
export type InsertEmailReport = typeof emailReports.$inferInsert;

/**
 * Day Close Log - Track when days are closed (prevents editing)
 */
export const dayCloseLog = mysqlTable("day_close_log", {
  id: int("id").autoincrement().primaryKey(),
  closeDate: date("closeDate").notNull().unique(),
  closedBy: int("closedBy").notNull(),
  totalSales: decimal("totalSales", { precision: 15, scale: 2 }).notNull(),
  totalExpenses: decimal("totalExpenses", { precision: 15, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DayCloseLog = typeof dayCloseLog.$inferSelect;
export type InsertDayCloseLog = typeof dayCloseLog.$inferInsert;


/**
 * Accounts Receivable - Track money owed by clients
 * Used for functions/events and large orders
 */
export const accountsReceivable = mysqlTable("accounts_receivable", {
  id: int("id").autoincrement().primaryKey(),
  clientName: varchar("clientName", { length: 255 }).notNull(),
  invoiceAmount: decimal("invoiceAmount", { precision: 15, scale: 2 }).notNull(),
  amountPaid: decimal("amountPaid", { precision: 15, scale: 2 }).default("0").notNull(),
  balanceRemaining: decimal("balanceRemaining", { precision: 15, scale: 2 }).notNull(),
  dueDate: date("dueDate").notNull(),
  status: mysqlEnum("status", ["paid", "partial", "overdue"]).default("partial").notNull(),
  eventReference: varchar("eventReference", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AccountsReceivable = typeof accountsReceivable.$inferSelect;
export type InsertAccountsReceivable = typeof accountsReceivable.$inferInsert;

/**
 * Accounts Payable - Track money owed to suppliers
 * Used for fruit suppliers, machine owners, vehicle hire providers
 */
export const accountsPayable = mysqlTable("accounts_payable", {
  id: int("id").autoincrement().primaryKey(),
  supplierName: varchar("supplierName", { length: 255 }).notNull(),
  amountOwed: decimal("amountOwed", { precision: 15, scale: 2 }).notNull(),
  paymentDate: date("paymentDate"),
  status: mysqlEnum("status", ["pending", "partial", "paid"]).default("pending").notNull(),
  supplierType: varchar("supplierType", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AccountsPayable = typeof accountsPayable.$inferSelect;
export type InsertAccountsPayable = typeof accountsPayable.$inferInsert;

/**
 * Custom Accounts - Allow admin/finance to create custom accounts
 * Classifications: Revenue, Expense, Asset, Liability, Equity
 */
export const customAccounts = mysqlTable("custom_accounts", {
  id: int("id").autoincrement().primaryKey(),
  accountName: varchar("accountName", { length: 255 }).notNull().unique(),
  accountCode: varchar("accountCode", { length: 50 }).notNull().unique(),
  classification: mysqlEnum("classification", ["revenue", "expense", "asset", "liability", "equity"]).notNull(),
  description: text("description"),
  balance: decimal("balance", { precision: 15, scale: 2 }).default("0").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CustomAccount = typeof customAccounts.$inferSelect;
export type InsertCustomAccount = typeof customAccounts.$inferInsert;

/**
 * Drawings Account - Track owner withdrawals (Equity classification)
 */
export const drawingsAccount = mysqlTable("drawings_account", {
  id: int("id").autoincrement().primaryKey(),
  withdrawalAmount: decimal("withdrawalAmount", { precision: 15, scale: 2 }).notNull(),
  withdrawalDate: date("withdrawalDate").notNull(),
  description: text("description"),
  approvedBy: int("approvedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DrawingsAccount = typeof drawingsAccount.$inferSelect;
export type InsertDrawingsAccount = typeof drawingsAccount.$inferInsert;

/**
 * Packages - Special offers (Birthday, Wedding, Corporate, etc.)
 */
export const packages = mysqlTable("packages", {
  id: int("id").autoincrement().primaryKey(),
  packageName: varchar("packageName", { length: 255 }).notNull().unique(),
  description: text("description"),
  price: decimal("price", { precision: 15, scale: 2 }).notNull(),
  includedItems: json("includedItems").$type<string[]>().notNull(),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Package = typeof packages.$inferSelect;
export type InsertPackage = typeof packages.$inferInsert;

/**
 * Client Receipts - Official receipts for client payments
 * Includes QR code for verification
 */
export const clientReceipts = mysqlTable("client_receipts", {
  id: int("id").autoincrement().primaryKey(),
  receiptNumber: varchar("receiptNumber", { length: 50 }).notNull().unique(),
  clientName: varchar("clientName", { length: 255 }).notNull(),
  eventReference: varchar("eventReference", { length: 255 }),
  amountPaid: decimal("amountPaid", { precision: 15, scale: 2 }).notNull(),
  paymentMethod: mysqlEnum("paymentMethod", ["cash", "mobile_money", "bank_transfer"]).notNull(),
  receiptDate: date("receiptDate").notNull(),
  issuedBy: int("issuedBy").notNull(),
  qrCode: text("qrCode"),
  pdfUrl: text("pdfUrl"),
  emailSent: boolean("emailSent").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ClientReceipt = typeof clientReceipts.$inferSelect;
export type InsertClientReceipt = typeof clientReceipts.$inferInsert;

/**
 * User Approval Status - Track pending user approvals
 */
export const userApprovals = mysqlTable("user_approvals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  approvedBy: int("approvedBy"),
  approvalDate: timestamp("approvalDate"),
  rejectionReason: text("rejectionReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserApproval = typeof userApprovals.$inferSelect;
export type InsertUserApproval = typeof userApprovals.$inferInsert;

/**
 * QR Code Links
 * Maps QR code tokens to client receipts for public access without authentication
 */
export const qrCodeLinks = mysqlTable(
  "qr_code_links",
  {
    id: int("id").autoincrement().primaryKey(),

    // Reference to receipt
    receiptId: int("receiptId").notNull(),

    // Unique token for QR code
    token: varchar("token", { length: 100 }).notNull().unique(),

    // Access control
    isPublic: boolean("isPublic").default(true).notNull(),
    expiresAt: timestamp("expiresAt"),
    accessCount: int("accessCount").default(0).notNull(),
    maxAccess: int("maxAccess"), // null = unlimited

    // Timestamps
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    lastAccessedAt: timestamp("lastAccessedAt"),
  },
  (table) => ({
    tokenIdx: index("qr_token_idx").on(table.token),
    receiptIdIdx: index("qr_receipt_id_idx").on(table.receiptId),
  })
);

export type QRCodeLink = typeof qrCodeLinks.$inferSelect;
export type InsertQRCodeLink = typeof qrCodeLinks.$inferInsert;
