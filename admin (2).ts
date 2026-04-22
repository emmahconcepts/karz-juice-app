import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users, userApprovals } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

// Admin-only procedure wrapper
export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user?.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

// ─────────────────────────────────────────────────────────────────────────────
// Safe delete helper — use this pattern for ALL module delete functions
// ─────────────────────────────────────────────────────────────────────────────
export async function safeDelete(
  db: any,
  opts: {
    table: any;
    idField: any;
    id: number;
    /** If truthy, do a soft delete (set this field to false) instead of hard delete */
    softDeleteField?: any;
    /** Dependency checks: array of { table, foreignKey } to verify no linked rows */
    dependencyChecks?: Array<{ table: any; foreignKey: any; label: string }>;
  }
) {
  // Run dependency checks first
  if (opts.dependencyChecks) {
    for (const dep of opts.dependencyChecks) {
      const rows = await db
        .select({ id: dep.foreignKey })
        .from(dep.table)
        .where(eq(dep.foreignKey, opts.id))
        .limit(1);
      if (rows.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Cannot delete: linked ${dep.label} records exist. Remove them first or use a soft delete.`,
        });
      }
    }
  }

  if (opts.softDeleteField) {
    // Soft delete — set isActive = false, preserves ledger integrity
    await db.update(opts.table).set({ [opts.softDeleteField]: false }).where(eq(opts.idField, opts.id));
    return { success: true, type: "soft" };
  } else {
    // Hard delete
    await db.delete(opts.table).where(eq(opts.idField, opts.id));
    return { success: true, type: "hard" };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Full admin router — includes original procedures + new approval workflow
// ─────────────────────────────────────────────────────────────────────────────
export const adminRouter = router({
  // ── Existing: User Management ──────────────────────────────────────────────
  getUsers: adminProcedure.query(async () => {
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
    .input(z.object({
      userId: z.number(),
      role: z.enum(["admin", "user", "finance", "operations"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await db.update(users).set({ role: input.role }).where(eq(users.id, input.userId));
      return { success: true };
    }),

  deactivateUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      // Soft-delete: update role to "user" (lowest) — extend schema with isActive if needed
      await db.update(users).set({ role: "user" }).where(eq(users.id, input.userId));
      return { success: true };
    }),

  // ── NEW: User Approval Workflow ────────────────────────────────────────────

  getPendingUsers: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
    const allApprovals = await db.select().from(userApprovals);

    return allUsers.map(u => {
      const approval = allApprovals.find(a => a.userId === u.id);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
        approvalStatus: (approval?.status ?? "pending") as "pending" | "approved" | "rejected",
        approvalId: approval?.id,
        rejectionReason: approval?.rejectionReason,
      };
    });
  }),

  approveUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const existing = await db
        .select()
        .from(userApprovals)
        .where(eq(userApprovals.userId, input.userId))
        .limit(1);

      if (existing.length) {
        await db.update(userApprovals).set({
          status: "approved",
          approvedBy: ctx.user!.id,
          approvalDate: new Date(),
          rejectionReason: null,
        }).where(eq(userApprovals.userId, input.userId));
      } else {
        await db.insert(userApprovals).values({
          userId: input.userId,
          status: "approved",
          approvedBy: ctx.user!.id,
          approvalDate: new Date(),
        });
      }
      return { success: true };
    }),

  rejectUser: adminProcedure
    .input(z.object({ userId: z.number(), reason: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const existing = await db
        .select()
        .from(userApprovals)
        .where(eq(userApprovals.userId, input.userId))
        .limit(1);

      if (existing.length) {
        await db.update(userApprovals).set({
          status: "rejected",
          approvedBy: ctx.user!.id,
          approvalDate: new Date(),
          rejectionReason: input.reason ?? null,
        }).where(eq(userApprovals.userId, input.userId));
      } else {
        await db.insert(userApprovals).values({
          userId: input.userId,
          status: "rejected",
          approvedBy: ctx.user!.id,
          approvalDate: new Date(),
          rejectionReason: input.reason ?? null,
        });
      }
      return { success: true };
    }),

  // ── Existing: System procedures (stubs — keep whatever was in original) ────
  getSystemHealth: adminProcedure.query(async () => {
    const db = await getDb();
    return {
      databaseStatus: db ? "healthy" : "error",
      apiStatus: "healthy",
      lastBackup: null,
    };
  }),

  getAuditLog: adminProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async () => {
      // Extend with real audit_log table when available
      return [];
    }),

  getRecentActivity: adminProcedure.query(async () => {
    return [];
  }),

  getDayCloseHistory: adminProcedure
    .input(z.object({ limit: z.number().default(10) }))
    .query(async () => {
      const db = await getDb();
      if (!db) return [];
      const { dayCloseLog } = await import("../../drizzle/schema");
      return db.select().from(dayCloseLog).orderBy(desc(dayCloseLog.createdAt)).limit(10);
    }),

  getSystemSettings: adminProcedure.query(async () => {
    return {
      organizationName: "Karz Juice",
      businessCurrency: "UGX",
      dayCloseTime: "23:59",
      sessionTimeout: 3600,
      backupFrequency: "daily",
    };
  }),

  closeDay: adminProcedure
    .input(z.object({ date: z.date(), notes: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const { dayCloseLog } = await import("../../drizzle/schema");
      await db.insert(dayCloseLog).values({
        closeDate: input.date,
        closedBy: ctx.user!.id,
        totalSales: "0",
        totalExpenses: "0",
        notes: input.notes,
      });
      return { success: true };
    }),

  triggerBackup: adminProcedure.mutation(async () => {
    // Integrate with backup service
    return { success: true, timestamp: new Date() };
  }),
});
