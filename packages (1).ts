import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { packages } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// Only admin or finance can mutate packages
async function assertAdminOrFinance(ctx: any) {
  if (ctx.user?.role !== "admin" && ctx.user?.role !== "finance") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin or Finance role required" });
  }
}

export const packagesRouter = router({
  getPackages: protectedProcedure
    .input(z.object({ status: z.enum(["active", "inactive"]).optional() }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const rows = await db.select().from(packages).orderBy(desc(packages.createdAt));
      if (input?.status) return rows.filter(p => p.status === input.status);
      return rows;
    }),

  getPackageById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const rows = await db.select().from(packages).where(eq(packages.id, input.id)).limit(1);
      if (!rows.length) throw new TRPCError({ code: "NOT_FOUND", message: "Package not found" });
      return rows[0];
    }),

  createPackage: protectedProcedure
    .input(z.object({
      packageName: z.string().min(1).max(255),
      description: z.string().optional(),
      price: z.string(),
      includedItems: z.array(z.string()).default([]),
      status: z.enum(["active", "inactive"]).default("active"),
    }))
    .mutation(async ({ input, ctx }) => {
      await assertAdminOrFinance(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      // Check duplicate name
      const existing = await db.select().from(packages).where(eq(packages.packageName, input.packageName)).limit(1);
      if (existing.length) throw new TRPCError({ code: "CONFLICT", message: "A package with this name already exists" });

      const result = await db.insert(packages).values({
        packageName: input.packageName,
        description: input.description ?? null,
        price: input.price,
        includedItems: input.includedItems,
        status: input.status,
      });
      return { success: true, id: (result as any).insertId };
    }),

  updatePackage: protectedProcedure
    .input(z.object({
      id: z.number(),
      packageName: z.string().min(1).max(255).optional(),
      description: z.string().optional(),
      price: z.string().optional(),
      includedItems: z.array(z.string()).optional(),
      status: z.enum(["active", "inactive"]).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await assertAdminOrFinance(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const { id, ...updates } = input;
      const filtered = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
      await db.update(packages).set(filtered).where(eq(packages.id, id));
      return { success: true };
    }),

  deletePackage: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await assertAdminOrFinance(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.delete(packages).where(eq(packages.id, input.id));
      return { success: true };
    }),

  togglePackageStatus: protectedProcedure
    .input(z.object({ id: z.number(), status: z.enum(["active", "inactive"]) }))
    .mutation(async ({ input, ctx }) => {
      await assertAdminOrFinance(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.update(packages).set({ status: input.status }).where(eq(packages.id, input.id));
      return { success: true };
    }),
});
