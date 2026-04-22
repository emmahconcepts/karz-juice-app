/**
 * MTN Mobile Money API Client
 * Handles all communication with MTN Mobile Money APIs
 * Supports both sandbox and production environments
 */

import axios, { AxiosInstance } from "axios";

export interface MtnConfig {
  environment: "sandbox" | "production";
  apiBaseUrl: string;
  apiKey: string;
  apiSecret: string;
  collectionPrimaryKey: string;
  disbursementPrimaryKey?: string;
  merchantId: string;
  timeout?: number;
}

export interface MtnTransaction {
  mtnTransactionId: string;
  referenceId?: string;
  amount: number;
  currency: string;
  payerPhoneNumber: string;
  payerName?: string;
  payeePhoneNumber?: string;
  description?: string;
  transactionType: "payment" | "reversal" | "refund" | "transfer";
  status: "pending" | "completed" | "failed" | "reversed";
  transactionDate: Date;
}

export interface MtnTransactionRequest {
  amount: number;
  currency: string;
  externalId: string;
  payer: {
    partyIdType: "MSISDN" | "EMAIL" | "PARTY_CODE";
    partyId: string;
  };
  payerMessage?: string;
  payeeNote?: string;
}

export interface MtnTransactionResponse {
  transactionId: string;
  status: string;
  amount: number;
  currency: string;
  externalId: string;
  payer: {
    partyIdType: string;
    partyId: string;
  };
  financialTransactionId?: string;
  reason?: string;
}

export class MtnMobileMoneyClient {
  private client: AxiosInstance;
  private config: MtnConfig;
  private accessToken: string = "";
  private tokenExpiresAt: number = 0;

  constructor(config: MtnConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.apiBaseUrl,
      timeout: config.timeout || 30000,
      headers: {
        "Content-Type": "application/json",
        "X-Reference-Id": this.generateReferenceId(),
      },
    });
  }

  /**
   * Authenticate with MTN API using OAuth2
   */
  async authenticate(): Promise<string> {
    try {
      const credentials = Buffer.from(
        `${this.config.apiKey}:${this.config.apiSecret}`
      ).toString("base64");

      const response = await this.client.post(
        "/oauth2/token",
        {
          grant_type: "client_credentials",
        },
        {
          headers: {
            Authorization: `Basic ${credentials}`,
          },
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiresAt = Date.now() + (response.data.expires_in || 3600) * 1000;

      return this.accessToken || "";
    } catch (error) {
      throw new Error(`MTN Authentication failed: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Ensure valid access token
   */
  private async ensureAuthenticated(): Promise<void> {
    if (!this.accessToken || !this.tokenExpiresAt || Date.now() >= this.tokenExpiresAt) {
      await this.authenticate();
    }
  }

  /**
   * Fetch transactions from MTN API
   */
  async fetchTransactions(
    startDate: Date,
    endDate: Date,
    limit: number = 100
  ): Promise<MtnTransaction[]> {
    try {
      await this.ensureAuthenticated();

      const response = await this.client.get("/collection/v1_0/requesttopay", {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          limit,
        },
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "X-Target-Environment": this.config.environment,
        },
      });

      return this.mapMtnTransactions(response.data);
    } catch (error) {
      throw new Error(`Failed to fetch MTN transactions: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(transactionId: string): Promise<MtnTransactionResponse> {
    try {
      await this.ensureAuthenticated();

      const response = await this.client.get(
        `/collection/v1_0/requesttopay/${transactionId}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "X-Target-Environment": this.config.environment,
          },
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get transaction status: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Request payment from customer
   */
  async requestPayment(request: MtnTransactionRequest): Promise<string> {
    try {
      await this.ensureAuthenticated();

      const referenceId = this.generateReferenceId();

      const response = await this.client.post(
        "/collection/v1_0/requesttopay",
        request,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "X-Reference-Id": referenceId,
            "X-Target-Environment": this.config.environment,
          },
        }
      );

      return response.headers["x-reference-id"] || referenceId;
    } catch (error) {
      throw new Error(`Failed to request payment: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Get account balance
   */
  async getAccountBalance(): Promise<number> {
    try {
      await this.ensureAuthenticated();

      const response = await this.client.get("/collection/v1_0/account/balance", {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "X-Target-Environment": this.config.environment,
        },
      });

      return parseFloat(response.data.availableBalance);
    } catch (error) {
      throw new Error(`Failed to get account balance: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phoneNumber: string): boolean {
    // MTN Uganda format: 256XXXXXXXXX or +256XXXXXXXXX
    const mtnUgandaPattern = /^(\+?256|0)[7][0-9]{8}$/;
    return mtnUgandaPattern.test(phoneNumber.replace(/\s/g, ""));
  }

  /**
   * Map MTN API response to internal transaction format
   */
  private mapMtnTransactions(data: any[]): MtnTransaction[] {
    return data.map((item) => ({
      mtnTransactionId: item.transactionId,
      referenceId: item.externalId,
      amount: parseFloat(item.amount),
      currency: item.currency,
      payerPhoneNumber: item.payer.partyId,
      payerName: item.payer.partyName,
      payeePhoneNumber: item.payee?.partyId,
      description: item.payerMessage,
      transactionType: this.mapTransactionType(item.status),
      status: this.mapTransactionStatus(item.status),
      transactionDate: new Date(item.timestamp),
    }));
  }

  /**
   * Map MTN status to internal transaction type
   */
  private mapTransactionType(
    status: string
  ): "payment" | "reversal" | "refund" | "transfer" {
    switch (status.toLowerCase()) {
      case "successful":
        return "payment";
      case "reversed":
        return "reversal";
      case "refunded":
        return "refund";
      default:
        return "payment";
    }
  }

  /**
   * Map MTN status to internal status
   */
  private mapTransactionStatus(
    status: string
  ): "pending" | "completed" | "failed" | "reversed" {
    switch (status.toLowerCase()) {
      case "successful":
        return "completed";
      case "pending":
        return "pending";
      case "failed":
        return "failed";
      case "reversed":
        return "reversed";
      default:
        return "pending";
    }
  }

  /**
   * Generate unique reference ID
   */
  private generateReferenceId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Extract error message from various error formats
   */
  private getErrorMessage(error: any): string {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.data?.error_description) {
      return error.response.data.error_description;
    }
    if (error.message) {
      return error.message;
    }
    return "Unknown error";
  }
}

/**
 * Create MTN client from environment variables
 */
export function createMtnClient(): MtnMobileMoneyClient | null {
  const apiKey = process.env.MTN_API_KEY;
  const apiSecret = process.env.MTN_API_SECRET;
  const collectionKey = process.env.MTN_COLLECTION_PRIMARY_KEY;
  const merchantId = process.env.MTN_MERCHANT_ID;
  const apiBaseUrl = process.env.MTN_API_BASE_URL;

  if (!apiKey || !apiSecret || !collectionKey || !merchantId || !apiBaseUrl) {
    console.warn("MTN Mobile Money credentials not configured");
    return null;
  }

  return new MtnMobileMoneyClient({
    environment: process.env.MTN_ENVIRONMENT === "production" ? "production" : "sandbox",
    apiBaseUrl,
    apiKey,
    apiSecret,
    collectionPrimaryKey: collectionKey,
    disbursementPrimaryKey: process.env.MTN_DISBURSEMENT_PRIMARY_KEY,
    merchantId,
  });
}
