import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createPesapalClient } from "../_core/pesapal-client";
import { createPesapalService } from "../_core/pesapal-service";

const pesapalClient = createPesapalClient();
const pesapalService = createPesapalService(pesapalClient);

export const pesapalRouter = router({
  // Check if PesaPal is enabled
  isEnabled: protectedProcedure.query(() => {
    return {
      enabled: pesapalService.isEnabled(),
    };
  }),

  // Initiate payment for a sale
  initiateSalePayment: protectedProcedure
    .input(
      z.object({
        saleId: z.number().positive(),
        amount: z.number().positive(),
        currency: z.string().default("UGX"),
        customerName: z.string().min(1),
        customerEmail: z.string().email(),
        customerPhone: z.string().optional(),
        callbackUrl: z.string().url(),
        redirectUrl: z.string().url(),
      })
    )
    .mutation(async ({ input }) => {
      if (!pesapalService.isEnabled()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "PesaPal payment gateway is not configured",
        });
      }

      try {
        const result = await pesapalService.createSalePayment(
          input.saleId,
          input.amount,
          input.currency,
          input.customerName,
          input.customerEmail,
          input.customerPhone || "",
          input.callbackUrl,
          input.redirectUrl
        );

        if (!result.success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: result.error || "Payment initiation failed",
          });
        }

        return {
          success: true,
          transactionId: result.transactionId,
          redirectUrl: result.redirectUrl,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to initiate payment",
        });
      }
    }),

  // Initiate payment for receivable (invoice)
  initiateReceivablePayment: protectedProcedure
    .input(
      z.object({
        receivableId: z.number().positive(),
        amount: z.number().positive(),
        currency: z.string().default("UGX"),
        customerName: z.string().min(1),
        customerEmail: z.string().email(),
        customerPhone: z.string().optional(),
        callbackUrl: z.string().url(),
        redirectUrl: z.string().url(),
      })
    )
    .mutation(async ({ input }) => {
      if (!pesapalService.isEnabled()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "PesaPal payment gateway is not configured",
        });
      }

      try {
        const result = await pesapalService.createReceivablePayment(
          input.receivableId,
          input.amount,
          input.currency,
          input.customerName,
          input.customerEmail,
          input.customerPhone || "",
          input.callbackUrl,
          input.redirectUrl
        );

        if (!result.success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: result.error || "Payment initiation failed",
          });
        }

        return {
          success: true,
          transactionId: result.transactionId,
          redirectUrl: result.redirectUrl,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to initiate payment",
        });
      }
    }),

  // Handle payment confirmation
  confirmPayment: protectedProcedure
    .input(
      z.object({
        pesapalTrackingId: z.string(),
        pesapalReference: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      if (!pesapalService.isEnabled()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "PesaPal payment gateway is not configured",
        });
      }

      try {
        const result = await pesapalService.handlePaymentConfirmation(
          input.pesapalTrackingId,
          input.pesapalReference
        );

        if (!result.success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: result.error || "Payment confirmation failed",
          });
        }

        return {
          success: true,
          status: result.status,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to confirm payment",
        });
      }
    }),

  // Get payment status
  getPaymentStatus: protectedProcedure
    .input(
      z.object({
        pesapalTrackingId: z.string(),
      })
    )
    .query(async ({ input }) => {
      if (!pesapalService.isEnabled()) {
        return {
          status: "unavailable",
          message: "PesaPal not configured",
        };
      }

      try {
        const result = await pesapalService.getPaymentStatus(input.pesapalTrackingId);
        return result;
      } catch (error) {
        return {
          status: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    }),

  // Process refund
  processRefund: protectedProcedure
    .input(
      z.object({
        pesapalReference: z.string(),
        refundAmount: z.number().positive(),
        reason: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!pesapalService.isEnabled()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "PesaPal payment gateway is not configured",
        });
      }

      // Check if user has permission to process refunds (admin or finance)
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can process refunds",
        });
      }

      try {
        const result = await pesapalService.processRefund(
          input.pesapalReference,
          input.refundAmount,
          input.reason
        );

        if (!result.success) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: result.error || "Refund processing failed",
          });
        }

        return {
          success: true,
          refundId: result.refundId,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process refund",
        });
      }
    }),
});
