import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  json,
  index,
  decimal,
} from "drizzle-orm/mysql-core";

/**
 * Receipt Configuration
 * Stores receipt template and printer settings
 */
export const receiptConfig = mysqlTable("receipt_config", {
  id: int("id").autoincrement().primaryKey(),

  // Business info
  businessName: varchar("businessName", { length: 255 }).notNull(),
  businessPhone: varchar("businessPhone", { length: 20 }),
  businessEmail: varchar("businessEmail", { length: 255 }),
  businessAddress: text("businessAddress"),
  businessLogo: text("businessLogo"), // Base64 or URL

  // Receipt settings
  receiptWidth: int("receiptWidth").default(80).notNull(), // mm
  showItemDescription: boolean("showItemDescription").default(true).notNull(),
  showQRCode: boolean("showQRCode").default(true).notNull(),
  qrCodeSize: int("qrCodeSize").default(100).notNull(), // pixels
  footer: text("footer"), // Custom footer text

  // Printer settings
  printerName: varchar("printerName", { length: 255 }),
  printerType: mysqlEnum("printerType", ["thermal", "inkjet", "pdf"]).default("thermal").notNull(),
  autoOpenDrawer: boolean("autoOpenDrawer").default(false).notNull(),

  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReceiptConfig = typeof receiptConfig.$inferSelect;
export type InsertReceiptConfig = typeof receiptConfig.$inferInsert;

/**
 * Receipts
 * Stores generated receipts with QR codes
 */
export const receipts = mysqlTable(
  "receipts",
  {
    id: int("id").autoincrement().primaryKey(),

    // Reference
    transactionId: varchar("transactionId", { length: 100 }).notNull().unique(),
    transactionType: mysqlEnum("transactionType", [
      "sale",
      "payment",
      "refund",
      "adjustment",
      "other",
    ]).notNull(),

    // Receipt details
    receiptNumber: varchar("receiptNumber", { length: 50 }).notNull().unique(),
    qrCode: text("qrCode").notNull(), // Base64 encoded QR code
    qrCodeUrl: varchar("qrCodeUrl", { length: 500 }), // Public URL to transaction details
    qrCodeToken: varchar("qrCodeToken", { length: 100 }).unique(), // Unique token for QR code link

    // Content
    htmlContent: longtext("htmlContent").notNull(),
    pdfUrl: varchar("pdfUrl", { length: 500 }), // URL to generated PDF

    // Amounts
    subtotal: decimal("subtotal", { precision: 15, scale: 2 }).notNull(),
    tax: decimal("tax", { precision: 15, scale: 2 }).default("0").notNull(),
    total: decimal("total", { precision: 15, scale: 2 }).notNull(),
    amountPaid: decimal("amountPaid", { precision: 15, scale: 2 }).notNull(),
    change: decimal("change", { precision: 15, scale: 2 }).default("0").notNull(),

    // Customer info
    customerName: varchar("customerName", { length: 255 }),
    customerPhone: varchar("customerPhone", { length: 20 }),

    // Items (JSON array)
    items: json("items").notNull(), // Array of {name, quantity, price, total}

    // Printing
    printCount: int("printCount").default(0).notNull(),
    lastPrintedAt: timestamp("lastPrintedAt"),
    printedBy: int("printedBy"), // User ID

    // Status
    status: mysqlEnum("status", ["draft", "printed", "emailed", "archived"]).default("draft").notNull(),

    // Timestamps
    issuedAt: timestamp("issuedAt").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    transactionIdIdx: index("transaction_id_idx").on(table.transactionId),
    receiptNumberIdx: index("receipt_number_idx").on(table.receiptNumber),
    qrCodeTokenIdx: index("qr_code_token_idx").on(table.qrCodeToken),
    statusIdx: index("status_idx").on(table.status),
  })
);

export type Receipt = typeof receipts.$inferSelect;
export type InsertReceipt = typeof receipts.$inferInsert;

/**
 * Receipt Print Jobs
 * Tracks print queue and history
 */
export const receiptPrintJobs = mysqlTable(
  "receipt_print_jobs",
  {
    id: int("id").autoincrement().primaryKey(),

    // Reference
    receiptId: int("receiptId").notNull(),

    // Job details
    printerName: varchar("printerName", { length: 255 }).notNull(),
    jobStatus: mysqlEnum("jobStatus", ["pending", "printing", "completed", "failed", "cancelled"]).default("pending").notNull(),
    errorMessage: text("errorMessage"),

    // Attempts
    attemptCount: int("attemptCount").default(0).notNull(),
    maxAttempts: int("maxAttempts").default(3).notNull(),

    // Timestamps
    queuedAt: timestamp("queuedAt").defaultNow().notNull(),
    startedAt: timestamp("startedAt"),
    completedAt: timestamp("completedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    receiptIdIdx: index("receipt_id_idx").on(table.receiptId),
    statusIdx: index("job_status_idx").on(table.jobStatus),
  })
);

export type ReceiptPrintJob = typeof receiptPrintJobs.$inferSelect;
export type InsertReceiptPrintJob = typeof receiptPrintJobs.$inferInsert;

/**
 * QR Code Links
 * Maps QR code tokens to transaction details for public access
 */
export const qrCodeLinks = mysqlTable(
  "qr_code_links",
  {
    id: int("id").autoincrement().primaryKey(),

    // Reference
    receiptId: int("receiptId").notNull(),
    token: varchar("token", { length: 100 }).notNull().unique(),

    // Access control
    isPublic: boolean("isPublic").default(false).notNull(),
    expiresAt: timestamp("expiresAt"),
    accessCount: int("accessCount").default(0).notNull(),
    maxAccess: int("maxAccess"), // null = unlimited

    // Timestamps
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    lastAccessedAt: timestamp("lastAccessedAt"),
  },
  (table) => ({
    tokenIdx: index("token_idx").on(table.token),
    receiptIdIdx: index("receipt_id_idx").on(table.receiptId),
  })
);

export type QRCodeLink = typeof qrCodeLinks.$inferSelect;
export type InsertQRCodeLink = typeof qrCodeLinks.$inferInsert;

/**
 * Receipt Templates
 * Customizable receipt templates
 */
export const receiptTemplates = mysqlTable("receipt_templates", {
  id: int("id").autoincrement().primaryKey(),

  // Template info
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"),

  // HTML template
  htmlTemplate: longtext("htmlTemplate").notNull(),

  // Template variables
  variables: json("variables"), // Array of variable names used in template

  // Status
  isActive: boolean("isActive").default(true).notNull(),
  isDefault: boolean("isDefault").default(false).notNull(),

  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReceiptTemplate = typeof receiptTemplates.$inferSelect;
export type InsertReceiptTemplate = typeof receiptTemplates.$inferInsert;
