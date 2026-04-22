import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { accountsPayable } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const payablesRouter = router({
  // Get all AP with pagination
  getPayables: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
        status: z.enum(["pending", "partial", "paid"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const results = await db.select().from(accountsPayable).limit(input.limit).offset(input.offset);
      return results;
    }),

  // Create new AP entry
  createPayable: protectedProcedure
    .input(
      z.object({
        supplierName: z.string().min(1),
        amountOwed: z.number().positive(),
        paymentDate: z.date().optional(),
        supplierType: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(accountsPayable).values({
        supplierName: input.supplierName,
        amountOwed: input.amountOwed.toString(),
        paymentDate: input.paymentDate,
        supplierType: input.supplierType,
        status: "pending",
      });

      return { success: true };
    }),

  // Update AP entry
  updatePayable: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        amountOwed: z.number().optional(),
        paymentDate: z.date().optional(),
        status: z.enum(["pending", "partial", "paid"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updates: Record<string, any> = {};
      if (input.amountOwed !== undefined) updates.amountOwed = input.amountOwed.toString();
      if (input.paymentDate !== undefined) updates.paymentDate = input.paymentDate;
      if (input.status !== undefined) updates.status = input.status;

      await db.update(accountsPayable).set(updates).where(eq(accountsPayable.id, input.id));
      return { success: true };
    }),

  // Delete AP entry
  deletePayable: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(accountsPayable).where(eq(accountsPayable.id, input.id));
      return { success: true };
    }),

  // Get AP summary
  getPayablesSummary: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { totalOwed: 0, pending: 0, partial: 0, paid: 0 };

    const results = await db.select().from(accountsPayable);
    
    const summary = results.reduce(
      (acc, ap) => ({
        totalOwed: acc.totalOwed + parseFloat(ap.amountOwed.toString()),
        pending: acc.pending + (ap.status === "pending" ? 1 : 0),
        partial: acc.partial + (ap.status === "partial" ? 1 : 0),
        paid: acc.paid + (ap.status === "paid" ? 1 : 0),
      }),
      { totalOwed: 0, pending: 0, partial: 0, paid: 0 }
    );

    return summary;
  }),
});
