import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { drawingsAccount } from "../../drizzle/schema";
import { desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

async function assertAdminOrFinance(ctx: any) {
  if (ctx.user?.role !== "admin" && ctx.user?.role !== "finance") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin or Finance role required" });
  }
}

export const drawingsRouter = router({
  getDrawings: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(drawingsAccount).orderBy(desc(drawingsAccount.createdAt));
  }),

  createDrawing: protectedProcedure
    .input(z.object({
      withdrawalAmount: z.string(),
      withdrawalDate: z.date(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      await assertAdminOrFinance(ctx);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      if (parseFloat(input.withdrawalAmount) <= 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Withdrawal amount must be positive" });
      }

      await db.insert(drawingsAccount).values({
        withdrawalAmount: input.withdrawalAmount,
        withdrawalDate: input.withdrawalDate,
        description: input.description ?? null,
        approvedBy: ctx.user!.id,
      });
      return { success: true };
    }),

  getTotalDrawings: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { total: 0, thisMonth: 0 };
    const rows = await db.select().from(drawingsAccount);
    const now = new Date();
    const total = rows.reduce((s, r) => s + parseFloat(r.withdrawalAmount.toString()), 0);
    const thisMonth = rows
      .filter(r => {
        const d = new Date(r.withdrawalDate);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      })
      .reduce((s, r) => s + parseFloat(r.withdrawalAmount.toString()), 0);
    return { total, thisMonth };
  }),
});
