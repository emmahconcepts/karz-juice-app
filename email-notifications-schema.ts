import { 
  int, 
  mysqlEnum, 
  mysqlTable, 
  text, 
  timestamp, 
  varchar,
  boolean,
  json,
  index
} from "drizzle-orm/mysql-core";

/**
 * Email Notification Configuration
 * Stores SMTP and notification settings
 */
export const emailConfig = mysqlTable("email_config", {
  id: int("id").autoincrement().primaryKey(),
  
  // SMTP Settings
  smtpHost: varchar("smtpHost", { length: 255 }).notNull(),
  smtpPort: int("smtpPort").notNull(),
  smtpUser: varchar("smtpUser", { length: 255 }).notNull(),
  smtpPasswordEncrypted: text("smtpPasswordEncrypted").notNull(),
  smtpFromEmail: varchar("smtpFromEmail", { length: 255 }).notNull(),
  smtpFromName: varchar("smtpFromName", { length: 255 }),
  
  // Configuration
  isEnabled: boolean("isEnabled").default(false).notNull(),
  useTLS: boolean("useTLS").default(true).notNull(),
  useSSL: boolean("useSSL").default(false).notNull(),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailConfig = typeof emailConfig.$inferSelect;
export type InsertEmailConfig = typeof emailConfig.$inferInsert;

/**
 * Notification Preferences
 * User-specific notification settings
 */
export const notificationPreferences = mysqlTable("notification_preferences", {
  id: int("id").autoincrement().primaryKey(),
  
  // User reference
  userId: int("userId").notNull(),
  
  // Daily Reconciliation Summary
  dailySummaryEnabled: boolean("dailySummaryEnabled").default(true).notNull(),
  dailySummaryTime: varchar("dailySummaryTime", { length: 5 }).default("09:00").notNull(), // HH:MM format
  
  // Payment Failure Alerts
  paymentFailureAlertEnabled: boolean("paymentFailureAlertEnabled").default(true).notNull(),
  paymentFailureAlertDelay: int("paymentFailureAlertDelay").default(5).notNull(), // minutes
  
  // Unmatched Transaction Alerts
  unmatchedTransactionAlertEnabled: boolean("unmatchedTransactionAlertEnabled").default(true).notNull(),
  unmatchedTransactionThreshold: int("unmatchedTransactionThreshold").default(10).notNull(), // count
  
  // Dispute Notifications
  disputeNotificationEnabled: boolean("disputeNotificationEnabled").default(true).notNull(),
  
  // Email recipients (comma-separated or JSON array)
  recipientEmails: text("recipientEmails").notNull(), // JSON array of emails
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
}));

export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreferences = typeof notificationPreferences.$inferInsert;

/**
 * Sent Notifications
 * Audit trail of all sent notifications
 */
export const sentNotifications = mysqlTable("sent_notifications", {
  id: int("id").autoincrement().primaryKey(),
  
  // Notification details
  notificationType: mysqlEnum("notificationType", [
    "daily_summary",
    "payment_failure",
    "unmatched_transactions",
    "dispute_reported",
    "reconciliation_complete",
    "system_alert"
  ]).notNull(),
  
  // Recipients
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  
  // Content
  subject: varchar("subject", { length: 255 }).notNull(),
  body: longtext("body").notNull(),
  
  // Status
  status: mysqlEnum("status", ["pending", "sent", "failed", "bounced"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  
  // Related data
  relatedData: json("relatedData"), // Store transaction IDs, amounts, etc.
  
  // Timestamps
  scheduledFor: timestamp("scheduledFor"),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  typeIdx: index("type_idx").on(table.notificationType),
  statusIdx: index("status_idx").on(table.status),
  emailIdx: index("email_idx").on(table.recipientEmail),
  scheduledIdx: index("scheduled_idx").on(table.scheduledFor),
}));

export type SentNotification = typeof sentNotifications.$inferSelect;
export type InsertSentNotification = typeof sentNotifications.$inferInsert;

/**
 * Notification Templates
 * Email templates for different notification types
 */
export const notificationTemplates = mysqlTable("notification_templates", {
  id: int("id").autoincrement().primaryKey(),
  
  // Template identification
  templateType: mysqlEnum("templateType", [
    "daily_summary",
    "payment_failure",
    "unmatched_transactions",
    "dispute_reported",
    "reconciliation_complete",
    "system_alert"
  ]).notNull().unique(),
  
  // Template content
  subject: varchar("subject", { length: 255 }).notNull(),
  htmlBody: longtext("htmlBody").notNull(),
  plainTextBody: longtext("plainTextBody"),
  
  // Variables documentation
  variables: json("variables"), // Array of variable names used in template
  
  // Status
  isActive: boolean("isActive").default(true).notNull(),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationTemplate = typeof notificationTemplates.$inferSelect;
export type InsertNotificationTemplate = typeof notificationTemplates.$inferInsert;

/**
 * Notification Logs
 * Detailed logs for debugging and audit
 */
export const notificationLogs = mysqlTable("notification_logs", {
  id: int("id").autoincrement().primaryKey(),
  
  // Reference
  sentNotificationId: int("sentNotificationId"),
  
  // Log details
  level: mysqlEnum("level", ["info", "warning", "error"]).notNull(),
  message: text("message").notNull(),
  details: json("details"),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  notificationIdIdx: index("notification_id_idx").on(table.sentNotificationId),
  levelIdx: index("level_idx").on(table.level),
}));

export type NotificationLog = typeof notificationLogs.$inferSelect;
export type InsertNotificationLog = typeof notificationLogs.$inferInsert;

/**
 * Reconciliation Summary Cache
 * Stores daily reconciliation data for email generation
 */
export const reconciliationSummary = mysqlTable("reconciliation_summary", {
  id: int("id").autoincrement().primaryKey(),
  
  // Date reference
  summaryDate: timestamp("summaryDate").notNull().unique(),
  
  // Summary data
  totalTransactions: int("totalTransactions").default(0).notNull(),
  matchedTransactions: int("matchedTransactions").default(0).notNull(),
  unmatchedTransactions: int("unmatchedTransactions").default(0).notNull(),
  disputedTransactions: int("disputedTransactions").default(0).notNull(),
  
  // Amounts
  totalAmount: varchar("totalAmount", { length: 50 }).notNull(),
  matchedAmount: varchar("matchedAmount", { length: 50 }).notNull(),
  unmatchedAmount: varchar("unmatchedAmount", { length: 50 }).notNull(),
  
  // Status
  failedTransactions: int("failedTransactions").default(0).notNull(),
  reversedTransactions: int("reversedTransactions").default(0).notNull(),
  
  // Additional metrics
  averageMatchTime: int("averageMatchTime").default(0).notNull(), // seconds
  successRate: varchar("successRate", { length: 10 }).default("0%").notNull(),
  
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  dateIdx: index("date_idx").on(table.summaryDate),
}));

export type ReconciliationSummary = typeof reconciliationSummary.$inferSelect;
export type InsertReconciliationSummary = typeof reconciliationSummary.$inferInsert;
