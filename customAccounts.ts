import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { customAccounts } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const customAccountsRouter = router({
  // Get all custom accounts with filtering
  getCustomAccounts: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
        classification: z.enum(["revenue", "expense", "asset", "liability", "equity"]).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const results = await db.select().from(customAccounts).limit(input.limit).offset(input.offset);
      return results;
    }),

  // Create new custom account (Admin/Finance only)
  createCustomAccount: protectedProcedure
    .input(
      z.object({
        accountName: z.string().min(1).max(255),
        accountCode: z.string().min(1).max(50),
        classification: z.enum(["revenue", "expense", "asset", "liability", "equity"]),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if user is admin or finance
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "finance") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admin and finance users can create custom accounts",
        });
      }

      // Check if account code already exists
      const existing = await db
        .select()
        .from(customAccounts)
        .where(eq(customAccounts.accountCode, input.accountCode))
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Account code already exists",
        });
      }

      await db.insert(customAccounts).values({
        accountName: input.accountName,
        accountCode: input.accountCode,
        classification: input.classification,
        description: input.description,
        balance: "0",
        isActive: true,
        createdBy: ctx.user?.id || 1,
      });

      return { success: true, message: "Custom account created successfully" };
    }),

  // Update custom account
  updateCustomAccount: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        accountName: z.string().optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user?.role !== "admin" && ctx.user?.role !== "finance") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admin and finance users can update custom accounts",
        });
      }

      const updates: Record<string, any> = {};
      if (input.accountName !== undefined) updates.accountName = input.accountName;
      if (input.description !== undefined) updates.description = input.description;
      if (input.isActive !== undefined) updates.isActive = input.isActive;

      await db.update(customAccounts).set(updates).where(eq(customAccounts.id, input.id));

      return { success: true, message: "Custom account updated successfully" };
    }),

  // Delete custom account
  deleteCustomAccount: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      if (ctx.user?.role !== "admin" && ctx.user?.role !== "finance") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admin and finance users can delete custom accounts",
        });
      }

      await db.delete(customAccounts).where(eq(customAccounts.id, input.id));

      return { success: true, message: "Custom account deleted successfully" };
    }),

  // Get account by ID
  getCustomAccountById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;

      const result = await db.select().from(customAccounts).where(eq(customAccounts.id, input.id)).limit(1);
      return result.length > 0 ? result[0] : null;
    }),

  // Get accounts by classification
  getAccountsByClassification: protectedProcedure
    .input(
      z.object({
        classification: z.enum(["revenue", "expense", "asset", "liability", "equity"]),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const results = await db
        .select()
        .from(customAccounts)
        .where(eq(customAccounts.classification, input.classification));
      return results;
    }),

  // Get account summary by classification
  getAccountSummaryByClassification: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return {};

    const results = await db.select().from(customAccounts);

    const summary = results.reduce(
      (acc, account) => {
        const classification = account.classification;
        if (!acc[classification]) {
          acc[classification] = { count: 0, totalBalance: 0 };
        }
        acc[classification].count += 1;
        acc[classification].totalBalance += parseFloat(account.balance.toString());
        return acc;
      },
      {} as Record<string, { count: number; totalBalance: number }>
    );

    return summary;
  }),

  // Generate next account code
  generateAccountCode: protectedProcedure
    .input(
      z.object({
        classification: z.enum(["revenue", "expense", "asset", "liability", "equity"]),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return "ERR-001";

      const prefix = {
        revenue: "REV",
        expense: "EXP",
        asset: "AST",
        liability: "LIA",
        equity: "EQT",
      }[input.classification];

      const results = await db
        .select()
        .from(customAccounts)
        .where(eq(customAccounts.classification, input.classification));

      const nextNumber = results.length + 1;
      return `${prefix}-${String(nextNumber).padStart(3, "0")}`;
    }),
});
