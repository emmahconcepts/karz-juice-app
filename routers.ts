import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

// ── Sub-routers ───────────────────────────────────────────────────────────────
import { salesRouter }          from "./routers/sales";
import { adminRouter }          from "./routers/admin";
import { ocrRouter }            from "./routers/ocr";
import { statementsRouter }     from "./routers/statements";
import { reportsRouter }        from "./routers/reports";
import { receivablesRouter }    from "./routers/receivables";
import { payablesRouter }       from "./routers/payables";
import { customAccountsRouter } from "./routers/customAccounts";
// Phase 9: packages, client receipts, search, drawings
import { packagesRouter }       from "./routers/packages";
import { receiptsRouter }       from "./routers/receipts";
import { searchRouter }         from "./routers/search";
import { ordersRouter }         from "./routers/orders";
import { drawingsRouter }       from "./routers/drawings";
// Phase 12–17: MTN, Notifications, PesaPal
import { mtnRouter }            from "./routers/mtn";
import { notificationsRouter }  from "./routers/notifications";
import { pesapalRouter }        from "./routers/pesapal";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ── Feature routers ───────────────────────────────────────────────────────
  sales:            salesRouter,
  admin:            adminRouter,
  ocr:              ocrRouter,
  statements:       statementsRouter,
  reports:          reportsRouter,
  receivables:      receivablesRouter,
  payables:         payablesRouter,
  customAccounts:   customAccountsRouter,
  packages:         packagesRouter,
  clientReceipts:   receiptsRouter,   // Official client receipts with QR
  receiptPrinting:  receiptsRouter,   // Same router, receipt printing UI endpoint
  search:           searchRouter,
  orders:           ordersRouter,
  drawings:         drawingsRouter,
  mtn:              mtnRouter,
  notifications:    notificationsRouter,
  pesapal:          pesapalRouter,

  // ── Dashboard ─────────────────────────────────────────────────────────────
  dashboard: router({
    getDailyKPIs: protectedProcedure
      .input(z.object({ date: z.date() }))
      .query(async ({ input }) => {
        const dailySales  = await db.getDailySalesTotalByDate(input.date);
        const expenses    = await db.getExpensesByDateRange(input.date, input.date);
        const expensesTotal = expenses.reduce((s, e) => s + parseFloat(e.amount.toString()), 0);
        return { dailySales: parseFloat(dailySales), expenses: expensesTotal, grossProfit: parseFloat(dailySales) - expensesTotal };
      }),
    getOverdueAlerts:  protectedProcedure.query(async () => db.getOverdueFunctions()),
    getAccountBalances: protectedProcedure.query(async () => db.getAllAccounts()),
  }),

  // ── Functions ─────────────────────────────────────────────────────────────
  functions: router({
    createFunction: protectedProcedure
      .input(z.object({ clientName: z.string(), eventType: z.string(), eventDate: z.date(), contractAmount: z.string(), depositPaid: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin" && ctx.user.role !== "operations") throw new TRPCError({ code: "FORBIDDEN" });
        const deposit = parseFloat(input.depositPaid || "0");
        return db.createFunction({ functionAccountId: 1, clientName: input.clientName, eventType: input.eventType, eventDate: input.eventDate, contractAmount: input.contractAmount, depositPaid: input.depositPaid || "0", balanceRemaining: (parseFloat(input.contractAmount) - deposit).toString(), status: "partial" });
      }),
    getAllFunctions:   protectedProcedure.query(async () => db.getAllFunctions()),
    getFunctionById:   protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => db.getFunctionById(input.id)),
    recordFunctionPayment: protectedProcedure
      .input(z.object({ functionId: z.number(), amountPaid: z.string(), paymentDate: z.date(), paymentMethod: z.enum(["cash", "mobile_money"]) }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin" && ctx.user.role !== "finance") throw new TRPCError({ code: "FORBIDDEN" });
        return db.createFunctionPayment({ functionId: input.functionId, amountPaid: input.amountPaid, paymentDate: input.paymentDate, paymentMethod: input.paymentMethod });
      }),
    deleteFunction: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return { success: true };
    }),
  }),

  // ── Expenses ──────────────────────────────────────────────────────────────
  expenses: router({
    recordExpense: protectedProcedure
      .input(z.object({ expenseDate: z.date(), amount: z.string(), category: z.enum(["general","machine_hire","vehicle_hire","utilities","ingredients","packaging_materials","wages_salaries"]), accountId: z.number(), description: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin" && ctx.user.role !== "finance") throw new TRPCError({ code: "FORBIDDEN" });
        return db.createExpense({ expenseDate: input.expenseDate, amount: input.amount, category: input.category as any, accountId: input.accountId, description: input.description, createdBy: ctx.user.id });
      }),
    getExpensesByDateRange: protectedProcedure.input(z.object({ startDate: z.date(), endDate: z.date() })).query(async ({ input }) => db.getExpensesByDateRange(input.startDate, input.endDate)),
    deleteExpense: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "finance") throw new TRPCError({ code: "FORBIDDEN" });
      return { success: true };
    }),
  }),

  // ── Machine Hire ──────────────────────────────────────────────────────────
  machineHire: router({
    recordMachineHire: protectedProcedure
      .input(z.object({ machineName: z.string(), ownerName: z.string(), costType: z.enum(["daily","per_job"]), hirePeriodStart: z.date(), hirePeriodEnd: z.date().optional(), costAmount: z.string() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin" && ctx.user.role !== "operations") throw new TRPCError({ code: "FORBIDDEN" });
        return db.createMachineHire({ machineName: input.machineName, ownerName: input.ownerName, costType: input.costType, hirePeriodStart: input.hirePeriodStart, hirePeriodEnd: input.hirePeriodEnd, costAmount: input.costAmount, paymentStatus: "pending" });
      }),
    getMachineHiresByDateRange: protectedProcedure.input(z.object({ startDate: z.date(), endDate: z.date() })).query(async ({ input }) => db.getMachineHiresByDateRange(input.startDate, input.endDate)),
    deleteMachineHire: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "operations") throw new TRPCError({ code: "FORBIDDEN" });
      return { success: true };
    }),
  }),

  // ── Vehicle Hire ──────────────────────────────────────────────────────────
  vehicleHire: router({
    recordVehicleHire: protectedProcedure
      .input(z.object({ vehicleOwnerName: z.string(), purpose: z.enum(["delivery","function","sourcing"]), hirePeriodStart: z.date(), hirePeriodEnd: z.date().optional(), cost: z.string(), fuelIncluded: z.boolean().optional(), paymentMethod: z.enum(["cash","mobile_money"]) }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin" && ctx.user.role !== "operations") throw new TRPCError({ code: "FORBIDDEN" });
        return db.createVehicleHire({ vehicleOwnerName: input.vehicleOwnerName, purpose: input.purpose, hirePeriodStart: input.hirePeriodStart, hirePeriodEnd: input.hirePeriodEnd, cost: input.cost, fuelIncluded: input.fuelIncluded || false, paymentMethod: input.paymentMethod });
      }),
    getVehicleHiresByDateRange: protectedProcedure.input(z.object({ startDate: z.date(), endDate: z.date() })).query(async ({ input }) => db.getVehicleHiresByDateRange(input.startDate, input.endDate)),
    deleteVehicleHire: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "operations") throw new TRPCError({ code: "FORBIDDEN" });
      return { success: true };
    }),
  }),

  // ── OCR Upload (legacy compatibility for OCRModule.tsx) ───────────────────
  receipts: router({
    uploadReceipt: protectedProcedure
      .input(z.object({ fileName: z.string(), fileUrl: z.string(), fileType: z.string(), extractedData: z.any().optional(), confidenceScore: z.string().optional() }))
      .mutation(async ({ input, ctx }) => db.createReceipt({ fileName: input.fileName, fileUrl: input.fileUrl, fileType: input.fileType, extractedData: input.extractedData, confidenceScore: input.confidenceScore, isConfirmed: false, uploadedBy: ctx.user.id })),
    getUnconfirmedReceipts: protectedProcedure.query(async () => db.getUnconfirmedReceipts()),
    confirmReceipt: protectedProcedure.input(z.object({ receiptId: z.number() })).mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "finance") throw new TRPCError({ code: "FORBIDDEN" });
      return db.confirmReceipt(input.receiptId, ctx.user.id);
    }),
    deleteReceipt: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "finance") throw new TRPCError({ code: "FORBIDDEN" });
      return { success: true };
    }),
    // Customer portal endpoints (public)
    getReceiptByQRToken: publicProcedure.input(z.object({ token: z.string() })).query(async ({ input }) => {
      const db2 = await import("../db").then(m => m.getDb());
      if (!db2) throw new TRPCError({ code: "NOT_FOUND" });
      // Lookup by qrCodeToken in receipts table
      const { receipts: receiptsTable } = await import("../../drizzle/schema") as any;
      const { eq } = await import("drizzle-orm");
      const rows = await db2.select().from(receiptsTable).where(eq(receiptsTable.qrCodeToken, input.token)).limit(1);
      if (!rows.length) throw new TRPCError({ code: "NOT_FOUND", message: "Receipt not found" });
      return { receipt: rows[0] };
    }),
    downloadInvoicePDF: publicProcedure.input(z.object({ token: z.string() })).mutation(async ({ input }) => {
      // InvoiceService generates PDF — wire in invoice-service.ts
      return { pdf: "", fileName: `invoice-${input.token}.pdf` };
    }),
  }),

  // ── Products ──────────────────────────────────────────────────────────────
  products: router({
    getAllProducts:   protectedProcedure.query(async () => db.getAllProducts()),
    createProduct: protectedProcedure.input(z.object({ name: z.string(), sku: z.string(), description: z.string().optional(), category: z.string().optional() })).mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return db.createProduct({ name: input.name, sku: input.sku, description: input.description, category: input.category, isActive: true });
    }),
    deleteProduct: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx }) => {
      if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
      return { success: true };
    }),
  }),

  // ── Offline Sync ──────────────────────────────────────────────────────────
  offline: router({
    getPendingSyncItems:  protectedProcedure.query(async ({ ctx }) => db.getPendingSyncItems(ctx.user.id)),
    markSyncItemAsSynced: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => db.markSyncItemAsSynced(input.id)),
  }),
});

export type AppRouter = typeof appRouter;
