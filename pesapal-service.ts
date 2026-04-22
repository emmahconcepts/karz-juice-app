import { PesapalClient, PesapalPaymentRequest } from "./pesapal-client";
import * as db from "../db";

export class PesapalService {
  private client: PesapalClient | null;

  constructor(client: PesapalClient | null) {
    this.client = client;
  }

  /**
   * Check if PesaPal is enabled
   */
  isEnabled(): boolean {
    return this.client !== null;
  }

  /**
   * Create payment for a sale
   */
  async createSalePayment(
    saleId: number,
    amount: number,
    currency: string,
    customerName: string,
    customerEmail: string,
    customerPhone: string,
    callbackUrl: string,
    redirectUrl: string
  ): Promise<{
    success: boolean;
    transactionId?: string;
    redirectUrl?: string;
    error?: string;
  }> {
    if (!this.client) {
      return { success: false, error: "PesaPal not configured" };
    }

    try {
      const orderId = `SALE-${saleId}-${Date.now()}`;

      const paymentRequest: PesapalPaymentRequest = {
        amount,
        currency,
        orderId,
        description: `Payment for Sale #${saleId}`,
        customerName,
        customerEmail,
        customerPhone,
        callbackUrl,
        redirectUrl,
        metadata: {
          saleId,
          type: "sale",
        },
      };

      const response = await this.client.initiatePayment(paymentRequest);

      if (!response.success) {
        return {
          success: false,
          error: response.error || "Payment initiation failed",
        };
      }

      // Store transaction record
      const transactionId = `TXN-${Date.now()}`;
      console.log("[PESAPAL_SERVICE] Payment initiated:", {
        transactionId,
        saleId,
        amount,
        pesapalReference: response.pesapalReference,
        pesapalTrackingId: response.pesapalTrackingId,
      });

      return {
        success: true,
        transactionId,
        redirectUrl: response.redirectUrl,
      };
    } catch (error) {
      console.error("[PESAPAL_SERVICE] Sale payment creation failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Create payment for receivable (invoice)
   */
  async createReceivablePayment(
    receivableId: number,
    amount: number,
    currency: string,
    customerName: string,
    customerEmail: string,
    customerPhone: string,
    callbackUrl: string,
    redirectUrl: string
  ): Promise<{
    success: boolean;
    transactionId?: string;
    redirectUrl?: string;
    error?: string;
  }> {
    if (!this.client) {
      return { success: false, error: "PesaPal not configured" };
    }

    try {
      const orderId = `REC-${receivableId}-${Date.now()}`;

      const paymentRequest: PesapalPaymentRequest = {
        amount,
        currency,
        orderId,
        description: `Payment for Invoice #${receivableId}`,
        customerName,
        customerEmail,
        customerPhone,
        callbackUrl,
        redirectUrl,
        metadata: {
          receivableId,
          type: "receivable",
        },
      };

      const response = await this.client.initiatePayment(paymentRequest);

      if (!response.success) {
        return {
          success: false,
          error: response.error || "Payment initiation failed",
        };
      }

      const transactionId = `TXN-${Date.now()}`;
      console.log("[PESAPAL_SERVICE] Receivable payment initiated:", {
        transactionId,
        receivableId,
        amount,
        pesapalReference: response.pesapalReference,
        pesapalTrackingId: response.pesapalTrackingId,
      });

      return {
        success: true,
        transactionId,
        redirectUrl: response.redirectUrl,
      };
    } catch (error) {
      console.error("[PESAPAL_SERVICE] Receivable payment creation failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Handle payment confirmation webhook
   */
  async handlePaymentConfirmation(
    pesapalTrackingId: string,
    pesapalReference: string
  ): Promise<{
    success: boolean;
    transactionId?: string;
    status?: string;
    error?: string;
  }> {
    if (!this.client) {
      return { success: false, error: "PesaPal not configured" };
    }

    try {
      const status = await this.client.getTransactionStatus(pesapalTrackingId);

      console.log("[PESAPAL_SERVICE] Transaction status:", {
        pesapalTrackingId,
        pesapalReference,
        status: status.status,
        paymentMethod: status.paymentMethod,
        amount: status.amount,
      });

      // Update transaction record based on status
      if (status.status === "COMPLETED") {
        console.log("[PESAPAL_SERVICE] Payment confirmed:", {
          pesapalReference,
          amount: status.amount,
          paymentMethod: status.paymentMethod,
        });
      }

      return {
        success: true,
        transactionId: pesapalReference,
        status: status.status,
      };
    } catch (error) {
      console.error("[PESAPAL_SERVICE] Payment confirmation failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Process refund request
   */
  async processRefund(
    pesapalReference: string,
    refundAmount: number,
    reason: string
  ): Promise<{
    success: boolean;
    refundId?: string;
    error?: string;
  }> {
    if (!this.client) {
      return { success: false, error: "PesaPal not configured" };
    }

    try {
      const result = await this.client.initiateRefund(pesapalReference, refundAmount, reason);

      if (result.success) {
        console.log("[PESAPAL_SERVICE] Refund initiated:", {
          pesapalReference,
          refundAmount,
          refundId: result.refundId,
        });
      }

      return result;
    } catch (error) {
      console.error("[PESAPAL_SERVICE] Refund processing failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(pesapalTrackingId: string): Promise<{
    status: string;
    paymentMethod?: string;
    amount?: number;
    currency?: string;
  }> {
    if (!this.client) {
      return { status: "error" };
    }

    try {
      return await this.client.getTransactionStatus(pesapalTrackingId);
    } catch (error) {
      console.error("[PESAPAL_SERVICE] Failed to get payment status:", error);
      return { status: "error" };
    }
  }
}

/**
 * Create PesaPal service from client
 */
export function createPesapalService(client: PesapalClient | null): PesapalService {
  return new PesapalService(client);
}
