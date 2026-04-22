/**
 * QR Code Service
 * Generates QR codes for receipts and transaction links
 */

import QRCode from "qrcode";
import crypto from "crypto";

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
}

export interface GeneratedQRCode {
  dataUrl: string; // Base64 data URL
  base64: string; // Base64 string without data URL prefix
  svg: string; // SVG string
}

export class QRCodeService {
  /**
   * Generate QR code from text/URL
   */
  async generateQRCode(
    text: string,
    options: QRCodeOptions = {}
  ): Promise<GeneratedQRCode> {
    try {
      const qrOptions = {
        width: options.width || 200,
        margin: options.margin || 2,
        color: {
          dark: options.color?.dark || "#000000",
          light: options.color?.light || "#FFFFFF",
        },
        errorCorrectionLevel: options.errorCorrectionLevel || "M",
      };

      // Generate data URL (PNG)
      const dataUrl = await QRCode.toDataURL(text, qrOptions);

      // Generate SVG
      const svg = await QRCode.toString(text, {
        type: "svg",
        width: options.width || 200,
        margin: options.margin || 2,
      });

      // Extract base64 from data URL
      const base64 = dataUrl.split(",")[1] || "";

      return {
        dataUrl,
        base64,
        svg,
      };
    } catch (error) {
      throw new Error(
        `Failed to generate QR code: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Generate unique QR code token
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString("hex");
  }

  /**
   * Generate QR code for transaction receipt
   */
  async generateReceiptQRCode(
    transactionId: string,
    token: string,
    baseUrl: string,
    options: QRCodeOptions = {}
  ): Promise<GeneratedQRCode> {
    // Create URL that points to receipt details
    const receiptUrl = `${baseUrl}/receipt/${token}`;

    return this.generateQRCode(receiptUrl, {
      ...options,
      width: options.width || 200,
      errorCorrectionLevel: "H", // High error correction for receipts
    });
  }

  /**
   * Generate QR code for payment link
   */
  async generatePaymentQRCode(
    paymentId: string,
    amount: number,
    currency: string,
    baseUrl: string,
    options: QRCodeOptions = {}
  ): Promise<GeneratedQRCode> {
    // Create payment link with details
    const paymentUrl = `${baseUrl}/pay/${paymentId}?amount=${amount}&currency=${currency}`;

    return this.generateQRCode(paymentUrl, {
      ...options,
      width: options.width || 150,
    });
  }

  /**
   * Validate QR code content
   */
  validateQRCodeContent(content: string): boolean {
    try {
      // Check if it's a valid URL or text
      if (content.length > 2953) {
        // QR code max capacity
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Generate batch QR codes
   */
  async generateBatchQRCodes(
    items: Array<{ id: string; data: string }>,
    options: QRCodeOptions = {}
  ): Promise<Map<string, GeneratedQRCode>> {
    const results = new Map<string, GeneratedQRCode>();

    for (const item of items) {
      try {
        const qrCode = await this.generateQRCode(item.data, options);
        results.set(item.id, qrCode);
      } catch (error) {
        console.error(`Failed to generate QR code for ${item.id}:`, error);
      }
    }

    return results;
  }
}

/**
 * Create QR code service instance
 */
export function createQRCodeService(): QRCodeService {
  return new QRCodeService();
}
