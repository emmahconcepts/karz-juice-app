import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

export const statementsRouter = router({
  getStatements: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
        accountId: z.number().optional(),
        status: z.enum(["uploaded", "processing", "reconciled"]).optional(),
      })
    )
    .query(async ({ input }) => {
      // Return mock statements
      return [
        {
          id: 1,
          fileName: "statement-march-2026.pdf",
          accountId: 1,
          accountName: "Main Cash Account",
          uploadedDate: new Date("2026-03-03T14:30:00"),
          statementDate: new Date("2026-03-03"),
          totalTransactions: 45,
          totalAmount: 5000000,
          status: "reconciled",
          matchedTransactions: 42,
          unmatchedTransactions: 3,
          uploadedBy: "Finance User",
        },
        {
          id: 2,
          fileName: "statement-march-2026-mobile.csv",
          accountId: 2,
          accountName: "Mobile Money Account",
          uploadedDate: new Date("2026-03-03T13:45:00"),
          statementDate: new Date("2026-03-03"),
          totalTransactions: 28,
          totalAmount: 3500000,
          status: "processing",
          matchedTransactions: 25,
          unmatchedTransactions: 3,
          uploadedBy: "Operations User",
        },
        {
          id: 3,
          fileName: "statement-march-2026-bank.pdf",
          accountId: 3,
          accountName: "Business Bank Account",
          uploadedDate: new Date("2026-03-03T12:00:00"),
          statementDate: new Date("2026-03-02"),
          totalTransactions: 12,
          totalAmount: 8500000,
          status: "uploaded",
          matchedTransactions: 10,
          unmatchedTransactions: 2,
          uploadedBy: "Finance User",
        },
      ];
    }),

  uploadStatement: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileUrl: z.string(),
        fileType: z.string(),
        accountId: z.number(),
        statementDate: z.date(),
      })
    )
    .mutation(async ({ input }) => {
      return {
        success: true,
        message: "Statement uploaded and queued for processing",
        statementId: `statement-${Date.now()}`,
        fileName: input.fileName,
        status: "processing",
      };
    }),

  getStatementById: protectedProcedure
    .input(z.object({ statementId: z.number() }))
    .query(async ({ input }) => {
      return {
        id: input.statementId,
        fileName: "statement-march-2026.pdf",
        accountId: 1,
        accountName: "Main Cash Account",
        uploadedDate: new Date("2026-03-03T14:30:00"),
        statementDate: new Date("2026-03-03"),
        totalTransactions: 45,
        totalAmount: 5000000,
        status: "reconciled",
        matchedTransactions: 42,
        unmatchedTransactions: 3,
        uploadedBy: "Finance User",
        transactions: [
          {
            id: 1,
            date: new Date("2026-03-03"),
            description: "Juice Sales",
            amount: 500000,
            balance: 5000000,
            status: "matched",
          },
          {
            id: 2,
            date: new Date("2026-03-03"),
            description: "Supplier Payment",
            amount: -250000,
            balance: 4750000,
            status: "matched",
          },
        ],
      };
    }),

  reconcileStatement: protectedProcedure
    .input(
      z.object({
        statementId: z.number(),
        matchedTransactionIds: z.array(z.number()),
      })
    )
    .mutation(async ({ input }) => {
      return {
        success: true,
        message: "Statement reconciliation complete",
        statementId: input.statementId,
        matchedCount: input.matchedTransactionIds.length,
        status: "reconciled",
      };
    }),

  getUnmatchedTransactions: protectedProcedure
    .input(z.object({ statementId: z.number() }))
    .query(async ({ input }) => {
      return [
        {
          id: 1,
          date: new Date("2026-03-03"),
          description: "Unknown Transaction",
          amount: 150000,
          possibleMatches: [
            { id: 101, description: "Expense - Utilities", amount: 150000 },
            { id: 102, description: "Expense - Supplies", amount: 150000 },
          ],
        },
        {
          id: 2,
          date: new Date("2026-03-02"),
          description: "Transfer In",
          amount: 1000000,
          possibleMatches: [
            { id: 201, description: "Function Payment - Wedding", amount: 1000000 },
          ],
        },
      ];
    }),
});
