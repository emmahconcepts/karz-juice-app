import crypto from "crypto";

export interface PesapalPaymentRequest {
  amount: number;
  currency: string;
  orderId: string;
  description: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  callbackUrl: string;
  redirectUrl: string;
  metadata?: Record<string, any>;
}

export interface PesapalPaymentResponse {
  success: boolean;
  redirectUrl?: string;
  pesapalReference?: string;
  pesapalTrackingId?: string;
  error?: string;
}

export interface PesapalTransactionStatus {
  status: string;
  paymentMethod?: string;
  amount?: number;
  currency?: string;
  pesapalReference?: string;
}

export class PesapalClient {
  private consumerKey: string;
  private consumerSecret: string;
  private apiUrl: string;
  private webhookSecret: string;
  private isSandbox: boolean;

  constructor(
    consumerKey: string,
    consumerSecret: string,
    webhookSecret: string,
    isSandbox: boolean = true,
    apiUrl: string = "https://api.pesapal.com"
  ) {
    this.consumerKey = consumerKey;
    this.consumerSecret = consumerSecret;
    this.webhookSecret = webhookSecret;
    this.isSandbox = isSandbox;
    this.apiUrl = apiUrl;
  }

  /**
   * Generate OAuth2 access token
   */
  async getAccessToken(): Promise<string> {
    try {
      const auth = Buffer.from(`${this.consumerKey}:${this.consumerSecret}`).toString("base64");
      
      const response = await fetch(`${this.apiUrl}/api/Auth/RequestToken`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get access token: ${response.statusText}`);
      }

      const data = await response.json() as { token: string };
      return data.token;
    } catch (error) {
      console.error("[PESAPAL] Failed to get access token:", error);
      throw error;
    }
  }

  /**
   * Initiate a payment request
   */
  async initiatePayment(request: PesapalPaymentRequest): Promise<PesapalPaymentResponse> {
    try {
      const token = await this.getAccessToken();

      const payload = {
        id: request.orderId,
        currency: request.currency,
        amount: request.amount,
        description: request.description,
        callback_url: request.callbackUrl,
        redirect_mode: "REDIRECT",
        customer: {
          email: request.customerEmail,
          first_name: request.customerName.split(" ")[0],
          last_name: request.customerName.split(" ").slice(1).join(" "),
          phone_number: request.customerPhone || "",
        },
        billing_address: {
          email_address: request.customerEmail,
          phone_number: request.customerPhone || "",
          country_code: "UG",
        },
      };

      const response = await fetch(`${this.apiUrl}/api/Transactions/InitiatePayment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Payment initiation failed: ${error}`);
      }

      const data = await response.json() as {
        redirect_url?: string;
        pesapal_reference?: string;
        pesapal_tracking_id?: string;
        error?: string;
      };

      return {
        success: true,
        redirectUrl: data.redirect_url,
        pesapalReference: data.pesapal_reference,
        pesapalTrackingId: data.pesapal_tracking_id,
      };
    } catch (error) {
      console.error("[PESAPAL] Payment initiation failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(pesapalTrackingId: string): Promise<PesapalTransactionStatus> {
    try {
      const token = await this.getAccessToken();

      const response = await fetch(
        `${this.apiUrl}/api/Transactions/GetTransactionStatus?pesapal_tracking_id=${pesapalTrackingId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get transaction status: ${response.statusText}`);
      }

      const data = await response.json() as {
        status?: string;
        payment_method?: string;
        amount?: number;
        currency?: string;
        pesapal_reference?: string;
      };

      return {
        status: data.status || "unknown",
        paymentMethod: data.payment_method,
        amount: data.amount,
        currency: data.currency,
        pesapalReference: data.pesapal_reference,
      };
    } catch (error) {
      console.error("[PESAPAL] Failed to get transaction status:", error);
      return { status: "error" };
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const hash = crypto
        .createHmac("sha256", this.webhookSecret)
        .update(payload)
        .digest("hex");

      return hash === signature;
    } catch (error) {
      console.error("[PESAPAL] Webhook signature verification failed:", error);
      return false;
    }
  }

  /**
   * Process webhook payload
   */
  processWebhookPayload(payload: Record<string, any>): {
    transactionId: string;
    status: string;
    pesapalReference?: string;
  } {
    return {
      transactionId: payload.id || "",
      status: payload.status || "unknown",
      pesapalReference: payload.pesapal_reference,
    };
  }

  /**
   * Initiate refund
   */
  async initiateRefund(
    pesapalReference: string,
    refundAmount: number,
    reason: string
  ): Promise<{ success: boolean; refundId?: string; error?: string }> {
    try {
      const token = await this.getAccessToken();

      const payload = {
        pesapal_reference: pesapalReference,
        amount: refundAmount,
        reason: reason,
      };

      const response = await fetch(`${this.apiUrl}/api/Transactions/RefundRequest`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Refund initiation failed: ${error}`);
      }

      const data = await response.json() as { refund_id?: string };

      return {
        success: true,
        refundId: data.refund_id,
      };
    } catch (error) {
      console.error("[PESAPAL] Refund initiation failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

/**
 * Create PesaPal client from environment variables
 */
export function createPesapalClient(): PesapalClient | null {
  const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
  const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;
  const webhookSecret = process.env.PESAPAL_WEBHOOK_SECRET;
  const isSandbox = process.env.PESAPAL_SANDBOX !== "false";
  const apiUrl = process.env.PESAPAL_API_URL || "https://api.pesapal.com";

  if (!consumerKey || !consumerSecret || !webhookSecret) {
    console.warn("[PESAPAL] Missing credentials - PesaPal integration disabled");
    return null;
  }

  return new PesapalClient(consumerKey, consumerSecret, webhookSecret, isSandbox, apiUrl);
}
