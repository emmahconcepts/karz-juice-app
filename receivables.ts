import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { accountsReceivable } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const receivablesRouter = router({
  // Get all AR with pagination and filters
  getReceivables: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
        status: z.enum(["paid", "partial", "overdue"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const results = await db.select().from(accountsReceivable).limit(input.limit).offset(input.offset);
      return results;
    }),

  // Create new AR entry
  createReceivable: protectedProcedure
    .input(
      z.object({
        clientName: z.string().min(1),
        invoiceAmount: z.number().positive(),
        amountPaid: z.number().default(0),
        dueDate: z.date(),
        eventReference: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const balanceRemaining = input.invoiceAmount - input.amountPaid;
      const status = input.amountPaid === 0 ? "partial" : input.amountPaid >= input.invoiceAmount ? "paid" : "partial";

      await db.insert(accountsReceivable).values({
        clientName: input.clientName,
        invoiceAmount: input.invoiceAmount.toString(),
        amountPaid: input.amountPaid.toString(),
        balanceRemaining: balanceRemaining.toString(),
        dueDate: input.dueDate,
        status,
        eventReference: input.eventReference,
      });

      return { success: true };
    }),

  // Update AR entry
  updateReceivable: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        amountPaid: z.number().optional(),
        status: z.enum(["paid", "partial", "overdue"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const existing = await db.select().from(accountsReceivable).where(eq(accountsReceivable.id, input.id)).limit(1);
      if (!existing.length) throw new Error("Receivable not found");

      const ar = existing[0];
      const newAmountPaid = input.amountPaid ?? parseFloat(ar.amountPaid.toString());
      const invoiceAmount = parseFloat(ar.invoiceAmount.toString());
      const balanceRemaining = invoiceAmount - newAmountPaid;
      const newStatus = input.status || (newAmountPaid >= invoiceAmount ? "paid" : newAmountPaid > 0 ? "partial" : "overdue");

      await db.update(accountsReceivable).set({
        amountPaid: newAmountPaid.toString(),
        balanceRemaining: balanceRemaining.toString(),
        status: newStatus,
      }).where(eq(accountsReceivable.id, input.id));

      return { success: true };
    }),

  // Delete AR entry
  deleteReceivable: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.delete(accountsReceivable).where(eq(accountsReceivable.id, input.id));
      return { success: true };
    }),

  // Get AR summary
  getReceivablesSummary: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { totalInvoiced: 0, totalPaid: 0, totalOutstanding: 0, overdue: 0 };

    const results = await db.select().from(accountsReceivable);
    
    const summary = results.reduce(
      (acc, ar) => ({
        totalInvoiced: acc.totalInvoiced + parseFloat(ar.invoiceAmount.toString()),
        totalPaid: acc.totalPaid + parseFloat(ar.amountPaid.toString()),
        totalOutstanding: acc.totalOutstanding + parseFloat(ar.balanceRemaining.toString()),
        overdue: acc.overdue + (ar.status === "overdue" ? 1 : 0),
      }),
      { totalInvoiced: 0, totalPaid: 0, totalOutstanding: 0, overdue: 0 }
    );

    return summary;
  }),
});
