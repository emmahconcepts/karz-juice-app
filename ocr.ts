import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";

export const ocrRouter = router({
  getScannedReceipts: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(50),
        offset: z.number().default(0),
        status: z.enum(["pending", "confirmed", "rejected"]).optional(),
      })
    )
    .query(async ({ input }) => {
      // Return mock scanned receipts
      return [
        {
          id: 1,
          fileName: "receipt-001.jpg",
          uploadedDate: new Date("2026-03-03T14:30:00"),
          vendor: "Supplier A",
          amount: 500000,
          date: new Date("2026-03-03"),
          confidence: {
            vendor: 0.95,
            amount: 0.98,
            date: 0.92,
          },
          status: "confirmed",
          uploadedBy: "Operations User",
        },
        {
          id: 2,
          fileName: "receipt-002.jpg",
          uploadedDate: new Date("2026-03-03T14:20:00"),
          vendor: "Supplier B",
          amount: 250000,
          date: new Date("2026-03-03"),
          confidence: {
            vendor: 0.87,
            amount: 0.91,
            date: 0.89,
          },
          status: "pending",
          uploadedBy: "Finance User",
        },
        {
          id: 3,
          fileName: "receipt-003.jpg",
          uploadedDate: new Date("2026-03-03T14:10:00"),
          vendor: "Supplier C",
          amount: 150000,
          date: new Date("2026-03-02"),
          confidence: {
            vendor: 0.78,
            amount: 0.85,
            date: 0.81,
          },
          status: "pending",
          uploadedBy: "Operations User",
        },
      ];
    }),

  uploadReceipt: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileUrl: z.string(),
        fileType: z.enum(["image/jpeg", "image/png", "application/pdf"]),
      })
    )
    .mutation(async ({ input }) => {
      return {
        success: true,
        message: "Receipt uploaded and queued for OCR processing",
        receiptId: `receipt-${Date.now()}`,
        fileName: input.fileName,
        status: "processing",
      };
    }),

  confirmReceipt: protectedProcedure
    .input(
      z.object({
        receiptId: z.number(),
        vendor: z.string(),
        amount: z.number(),
        date: z.date(),
      })
    )
    .mutation(async ({ input }) => {
      return {
        success: true,
        message: "Receipt confirmed and posted to ledger",
        receiptId: input.receiptId,
        status: "confirmed",
      };
    }),

  rejectReceipt: protectedProcedure
    .input(
      z.object({
        receiptId: z.number(),
        reason: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      return {
        success: true,
        message: "Receipt rejected",
        receiptId: input.receiptId,
        reason: input.reason,
      };
    }),

  getReceiptById: protectedProcedure
    .input(z.object({ receiptId: z.number() }))
    .query(async ({ input }) => {
      return {
        id: input.receiptId,
        fileName: "receipt-001.jpg",
        uploadedDate: new Date("2026-03-03T14:30:00"),
        vendor: "Supplier A",
        amount: 500000,
        date: new Date("2026-03-03"),
        confidence: {
          vendor: 0.95,
          amount: 0.98,
          date: 0.92,
        },
        status: "confirmed",
        uploadedBy: "Operations User",
      };
    }),
});
