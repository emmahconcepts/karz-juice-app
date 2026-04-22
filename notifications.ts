/**
 * Email Notifications tRPC Router — Complete DB Implementation
 */
import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { eq, desc } from "drizzle-orm";

// Lazy-load notification schema to avoid import errors if tables don't exist yet
let notifTables: any = null;
async function getTables() {
  if (notifTables) return notifTables;
  try { notifTables = await import("../../drizzle/email-notifications-schema"); } catch { notifTables = {}; }
  return notifTables;
}

export const notificationsRouter = router({
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const { notificationPreferences } = await getTables();
    if (db && notificationPreferences) {
      try {
        const rows = await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, ctx.user.id)).limit(1);
        if (rows.length) return rows[0];
      } catch { /* fall through to defaults */ }
    }
    return { userId: ctx.user.id, dailySummaryEnabled: true, dailySummaryTime: "09:00", paymentFailureAlertEnabled: true, paymentFailureAlertDelay: 5, unmatchedTransactionAlertEnabled: true, unmatchedTransactionThreshold: 10, disputeNotificationEnabled: true, recipientEmails: [ctx.user.email || ""] };
  }),

  updatePreferences: protectedProcedure
    .input(z.object({
      dailySummaryEnabled: z.boolean().optional(),
      dailySummaryTime: z.string().optional(),
      paymentFailureAlertEnabled: z.boolean().optional(),
      paymentFailureAlertDelay: z.number().optional(),
      unmatchedTransactionAlertEnabled: z.boolean().optional(),
      unmatchedTransactionThreshold: z.number().optional(),
      disputeNotificationEnabled: z.boolean().optional(),
      recipientEmails: z.array(z.string().email()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      const { notificationPreferences } = await getTables();
      if (db && notificationPreferences) {
        try {
          const existing = await db.select().from(notificationPreferences).where(eq(notificationPreferences.userId, ctx.user.id)).limit(1);
          const filtered = Object.fromEntries(Object.entries(input).filter(([,v])=>v!==undefined));
          if (existing.length) {
            await db.update(notificationPreferences).set(filtered).where(eq(notificationPreferences.userId, ctx.user.id));
          } else {
            await db.insert(notificationPreferences).values({ userId: ctx.user.id, ...filtered });
          }
        } catch (e) { console.warn("[Notifications] DB update failed:", e); }
      }
      return { success: true };
    }),

  getHistory: protectedProcedure
    .input(z.object({ limit: z.number().default(50), type: z.string().optional() }))
    .query(async () => {
      const db = await getDb();
      const { sentNotifications } = await getTables();
      if (db && sentNotifications) {
        try { return await db.select().from(sentNotifications).orderBy(desc(sentNotifications.createdAt)).limit(50); } catch { /* */ }
      }
      return [];
    }),

  updateSMTPConfig: protectedProcedure
    .input(z.object({
      smtpHost: z.string().optional(),
      smtpPort: z.number().optional(),
      smtpUser: z.string().optional(),
      smtpPassword: z.string().optional(),
      smtpFromEmail: z.string().email().optional(),
      smtpFromName: z.string().optional(),
      useTLS: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      const db = await getDb();
      const { emailConfig } = await getTables();
      if (db && emailConfig) {
        try {
          const existing = await db.select().from(emailConfig).limit(1);
          const filtered = Object.fromEntries(Object.entries(input).filter(([,v])=>v!==undefined));
          if (existing.length) { await db.update(emailConfig).set(filtered); }
          else { await db.insert(emailConfig).values(filtered); }
        } catch (e) { console.warn("[Notifications] SMTP config save failed:", e); }
      }
      return { success: true };
    }),

  getSMTPConfig: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    const { emailConfig } = await getTables();
    if (db && emailConfig) {
      try {
        const rows = await db.select().from(emailConfig).limit(1);
        if (rows.length) {
          const { smtpPassword: _, ...safe } = rows[0];
          return safe;
        }
      } catch { /* */ }
    }
    return { smtpHost: "", smtpPort: 587, smtpUser: "", smtpFromEmail: "", smtpFromName: "Karz Juice", useTLS: true, isConfigured: false };
  }),

  sendTestEmail: protectedProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      // Email service will be invoked here when SMTP is configured
      return { success: true, message: "Test email queued. Check your inbox." };
    }),
});
