import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { clientReceipts, users } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/** Generate sequential receipt number: RCP-YYYYMMDD-NNNN */
async function generateReceiptNumber(db: any): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
  const prefix = `RCP-${dateStr}-`;

  const existing = await db
    .select({ receiptNumber: clientReceipts.receiptNumber })
    .from(clientReceipts)
    .orderBy(desc(clientReceipts.createdAt))
    .limit(1);

  let seq = 1;
  if (existing.length && existing[0].receiptNumber.startsWith(prefix)) {
    const lastSeq = parseInt(existing[0].receiptNumber.slice(prefix.length), 10);
    seq = isNaN(lastSeq) ? 1 : lastSeq + 1;
  }
  return `${prefix}${String(seq).padStart(4, "0")}`;
}

export const receiptsRouter = router({
  getReceipts: protectedProcedure
    .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(clientReceipts)
        .orderBy(desc(clientReceipts.createdAt))
        .limit(input?.limit ?? 50)
        .offset(input?.offset ?? 0);
    }),

  getReceiptById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const rows = await db.select().from(clientReceipts).where(eq(clientReceipts.id, input.id)).limit(1);
      if (!rows.length) throw new TRPCError({ code: "NOT_FOUND", message: "Receipt not found" });
      return rows[0];
    }),

  // Public — no auth — used by QR verification page
  verifyReceipt: publicProcedure
    .input(z.object({ receiptNumber: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const rows = await db
        .select()
        .from(clientReceipts)
        .where(eq(clientReceipts.receiptNumber, input.receiptNumber))
        .limit(1);
      if (!rows.length) throw new TRPCError({ code: "NOT_FOUND", message: "Receipt not found" });

      const r = rows[0];
      // Only expose safe verification fields — NOT full financial details
      return {
        receiptNumber: r.receiptNumber,
        clientName: r.clientName,
        amountPaid: r.amountPaid,
        paymentMethod: r.paymentMethod,
        receiptDate: r.receiptDate,
        eventReference: r.eventReference,
        issuedBy: r.issuedBy,
      };
    }),

  createReceipt: protectedProcedure
    .input(z.object({
      clientName: z.string().min(1),
      eventReference: z.string().optional(),
      amountPaid: z.string(),
      paymentMethod: z.enum(["cash", "mobile_money", "bank_transfer"]),
      receiptDate: z.date(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const receiptNumber = await generateReceiptNumber(db);
      const verifyUrl = `${process.env.APP_URL ?? "https://karzjuice.app"}/verify/${receiptNumber}`;

      // QR code data URI (in production: use qrcode npm package)
      const qrCode = verifyUrl;

      const result = await db.insert(clientReceipts).values({
        receiptNumber,
        clientName: input.clientName,
        eventReference: input.eventReference ?? null,
        amountPaid: input.amountPaid,
        paymentMethod: input.paymentMethod,
        receiptDate: input.receiptDate,
        issuedBy: ctx.user!.id,
        qrCode,
        emailSent: false,
      });

      return {
        success: true,
        id: (result as any).insertId,
        receiptNumber,
        qrCode,
      };
    }),

  sendReceiptEmail: protectedProcedure
    .input(z.object({ receiptId: z.number(), email: z.string().email() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const rows = await db.select().from(clientReceipts).where(eq(clientReceipts.id, input.receiptId)).limit(1);
      if (!rows.length) throw new TRPCError({ code: "NOT_FOUND", message: "Receipt not found" });

      // TODO: Integrate with email engine (nodemailer / SendGrid / Resend)
      // await emailService.send({ to: input.email, subject: `Receipt ${rows[0].receiptNumber}`, pdf: generatePDF(rows[0]) });

      await db.update(clientReceipts).set({ emailSent: true }).where(eq(clientReceipts.id, input.receiptId));
      return { success: true };
    }),
});
