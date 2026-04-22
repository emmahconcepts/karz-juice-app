/**
 * MTN Mobile Money tRPC Router
 * Handles all MTN-related API endpoints
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { MtnReconciliationService } from "../_core/mtn-reconciliation";
import { TRPCError } from "@trpc/server";

const mtnService = new MtnReconciliationService();

export const mtnRouter = router({
  /**
   * Get MTN reconciliation status
   */
  getStatus: protectedProcedure.query(async () => {
    try {
      const status = await mtnService.getReconciliationStatus();
      return status;
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Failed to get MTN status",
      });
    }
  }),

  /**
   * Sync MTN transactions
   */
  syncTransactions: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
        autoReconcile: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const result = await mtnService.syncAndReconcile(
          input.startDate,
          input.endDate,
          input.autoReconcile
        );
        return result;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to sync MTN transactions",
        });
      }
    }),

  /**
   * Get unmatched transactions
   */
  getUnmatchedTransactions: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      try {
        const transactions = await mtnService.getUnmatchedTransactions(input.limit);
        return transactions;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to fetch unmatched transactions",
        });
      }
    }),

  /**
   * Get transaction history
   */
  getTransactionHistory: protectedProcedure
    .input(
      z.object({
        startDate: z.date(),
        endDate: z.date(),
        limit: z.number().default(100),
      })
    )
    .query(async ({ input }) => {
      try {
        const transactions = await mtnService.getTransactionHistory(
          input.startDate,
          input.endDate,
          input.limit
        );
        return transactions;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to fetch transaction history",
        });
      }
    }),

  /**
   * Manually reconcile a transaction
   */
  manuallyReconcile: protectedProcedure
    .input(
      z.object({
        mtnTransactionId: z.string(),
        receivableId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await mtnService.manuallyReconcile(input.mtnTransactionId, input.receivableId);
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to reconcile transaction",
        });
      }
    }),

  /**
   * Report a transaction as disputed
   */
  reportDispute: protectedProcedure
    .input(
      z.object({
        mtnTransactionId: z.string(),
        reason: z.enum(["amount_mismatch", "duplicate", "unauthorized", "service_issue", "other"]),
        description: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await mtnService.reportDispute(
          input.mtnTransactionId,
          input.reason,
          input.description
        );
        return { success: true };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to report dispute",
        });
      }
    }),

  /**
   * Get account balance
   */
  getAccountBalance: protectedProcedure.query(async () => {
    try {
      // TODO: Implement when MTN client is fully integrated
      return {
        balance: 0,
        currency: "UGX",
        lastUpdated: new Date(),
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error instanceof Error ? error.message : "Failed to get account balance",
      });
    }
  }),
});
