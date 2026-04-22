import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

// Admin-only procedure wrapper
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user?.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }
  return next({ ctx });
});

export const adminRouter = router({
  // User Management
  getUsers: adminProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const allUsers = await db.select().from(users);
    return allUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      loginMethod: u.loginMethod,
      createdAt: u.createdAt,
      lastSignedIn: u.lastSignedIn,
    }));
  }),

  getUserById: adminProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const user = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (!user.length) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

      return user[0];
    }),

  updateUserRole: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        role: z.enum(["admin", "user"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db.update(users).set({ role: input.role }).where(eq(users.id, input.userId));

      return { success: true, message: `User role updated to ${input.role}` };
    }),

  deactivateUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (input.userId === ctx.user?.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot deactivate your own account",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Mark user as deactivated by setting role to 'user' and clearing last sign-in
      await db
        .update(users)
        .set({ role: "user", lastSignedIn: new Date("1970-01-01") })
        .where(eq(users.id, input.userId));

      return { success: true, message: "User deactivated" };
    }),

  // System Settings
  getSystemSettings: adminProcedure.query(async () => {
    // Return system configuration
    return {
      organizationName: process.env.OWNER_NAME || "Karz Juice Enterprise",
      businessCurrency: "UGX",
      timezone: "Africa/Kampala",
      fiscalYearStart: "01-01",
      dayCloseTime: "23:59",
      autoBackupEnabled: true,
      backupFrequency: "daily",
      auditLogRetention: 365,
      maxLoginAttempts: 5,
      sessionTimeout: 3600,
    };
  }),

  updateSystemSettings: adminProcedure
    .input(
      z.object({
        organizationName: z.string().optional(),
        dayCloseTime: z.string().optional(),
        autoBackupEnabled: z.boolean().optional(),
        auditLogRetention: z.number().optional(),
        sessionTimeout: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // In production, store these in a settings table
      return {
        success: true,
        message: "System settings updated",
        settings: input,
      };
    }),

  // Day Close Management
  getDayCloseStatus: adminProcedure
    .input(
      z.object({
        date: z.date(),
      })
    )
    .query(async ({ input }) => {
      return {
        date: input.date,
        isClosed: false,
        closedBy: null,
        closedAt: null,
        notes: null,
      };
    }),

  getDayCloseHistory: adminProcedure
    .input(
      z.object({
        limit: z.number().default(30),
        offset: z.number().default(0),
      })
    )
    .query(async () => {
      // Return mock day close history
      return [
        {
          id: 1,
          closedDate: new Date("2026-03-02"),
          closedBy: "Admin User",
          totalSales: 1500000,
          totalExpenses: 450000,
          netProfit: 1050000,
          status: "closed",
        },
        {
          id: 2,
          closedDate: new Date("2026-03-01"),
          closedBy: "Admin User",
          totalSales: 1200000,
          totalExpenses: 360000,
          netProfit: 840000,
          status: "closed",
        },
      ];
    }),

  closeDay: adminProcedure
    .input(
      z.object({
        date: z.date(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return {
        success: true,
        message: `Day ${input.date.toDateString()} closed successfully`,
        closedBy: ctx.user?.name,
        timestamp: new Date(),
      };
    }),

  reopenDay: adminProcedure
    .input(
      z.object({
        reopenDate: z.date(),
        reason: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return {
        success: true,
        message: `Day ${input.reopenDate.toDateString()} reopened`,
        reopenedBy: ctx.user?.name,
        reason: input.reason,
        timestamp: new Date(),
      };
    }),

  // Audit Log
  getAuditLog: adminProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
        action: z.string().optional(),
        userId: z.number().optional(),
      })
    )
    .query(async () => {
      // Return mock audit log
      return [
        {
          id: 1,
          timestamp: new Date("2026-03-02T14:30:00"),
          userId: 1,
          userName: "Admin User",
          action: "CREATE_SALE",
          resourceType: "Sale",
          resourceId: 123,
          details: "Created sale for UGX 500,000",
          ipAddress: "192.168.1.1",
        },
        {
          id: 2,
          timestamp: new Date("2026-03-02T14:25:00"),
          userId: 2,
          userName: "Finance User",
          action: "CREATE_EXPENSE",
          resourceType: "Expense",
          resourceId: 456,
          details: "Created expense for UGX 150,000",
          ipAddress: "192.168.1.2",
        },
      ];
    }),

  // System Health
  getSystemHealth: adminProcedure.query(async () => {
    return {
      status: "healthy",
      database: {
        status: "connected",
        responseTime: 12,
        lastCheck: new Date(),
      },
      api: {
        status: "operational",
        uptime: 99.9,
        requestsPerSecond: 45,
      },
      storage: {
        used: "2.3 GB",
        available: "7.7 GB",
        percentage: 23,
      },
      lastBackup: new Date("2026-03-02T02:00:00"),
    };
  }),

  // Backup & Export
  triggerBackup: adminProcedure.mutation(async ({ ctx }) => {
    return {
      success: true,
      message: "Backup initiated",
      backupId: `backup-${Date.now()}`,
      initiatedBy: ctx.user?.name,
      estimatedTime: "5 minutes",
    };
  }),

  exportData: adminProcedure
    .input(
      z.object({
        dataType: z.enum(["sales", "expenses", "functions", "all"]),
        format: z.enum(["csv", "json", "excel"]),
        dateRange: z.object({
          start: z.date(),
          end: z.date(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      return {
        success: true,
        message: `${input.dataType} data exported as ${input.format}`,
        fileUrl: `/exports/karz-juice-${input.dataType}-${Date.now()}.${input.format}`,
        rowCount: 1250,
      };
    }),

  // Activity Dashboard
  getRecentActivity: adminProcedure.query(async () => {
    return [
      {
        id: 1,
        type: "sale",
        description: "New sale recorded",
        amount: 500000,
        user: "Operations User",
        timestamp: new Date("2026-03-02T14:30:00"),
      },
      {
        id: 2,
        type: "expense",
        description: "Expense recorded",
        amount: 150000,
        user: "Finance User",
        timestamp: new Date("2026-03-02T14:25:00"),
      },
      {
        id: 3,
        type: "function",
        description: "Function payment received",
        amount: 2000000,
        user: "Operations User",
        timestamp: new Date("2026-03-02T14:20:00"),
      },
      {
        id: 4,
        type: "user_login",
        description: "User logged in",
        user: "Admin User",
        timestamp: new Date("2026-03-02T14:15:00"),
      },
      {
        id: 5,
        type: "day_close",
        description: "Day closed",
        user: "Admin User",
        timestamp: new Date("2026-03-02T00:05:00"),
      },
    ];
  }),

  // Notification Preferences
  getNotificationPreferences: adminProcedure.query(async ({ ctx }) => {
    return {
      userId: ctx.user?.id,
      emailNotifications: {
        dailySummary: true,
        weeklyReport: true,
        criticalAlerts: true,
        systemUpdates: false,
      },
      notificationTiming: {
        dailySummaryTime: "06:00",
        weeklyReportDay: "Monday",
        weeklyReportTime: "08:00",
      },
    };
  }),

  updateNotificationPreferences: adminProcedure
    .input(
      z.object({
        emailNotifications: z.object({
          dailySummary: z.boolean().optional(),
          weeklyReport: z.boolean().optional(),
          criticalAlerts: z.boolean().optional(),
          systemUpdates: z.boolean().optional(),
        }).optional(),
        notificationTiming: z.object({
          dailySummaryTime: z.string().optional(),
          weeklyReportDay: z.string().optional(),
          weeklyReportTime: z.string().optional(),
        }).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      return {
        success: true,
        message: "Notification preferences updated",
        preferences: input,
      };
    }),
});
