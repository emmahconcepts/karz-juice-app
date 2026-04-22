/**
 * Receipt Service
 * Handles receipt generation, templates, and PDF conversion
 */

import { QRCodeService } from "./qr-code-service";

export interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  description?: string;
}

export interface ReceiptData {
  receiptNumber: string;
  transactionId: string;
  transactionType: "sale" | "payment" | "refund" | "adjustment" | "other";
  issuedAt: Date;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  total: number;
  amountPaid: number;
  change: number;
  paymentMethod: string;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  qrCodeUrl?: string;
  qrCodeImage?: string; // Base64
}

export interface ReceiptConfig {
  businessName: string;
  businessPhone?: string;
  businessEmail?: string;
  businessAddress?: string;
  businessLogo?: string;
  footer?: string;
  receiptWidth: number; // mm
  showItemDescription: boolean;
  showQRCode: boolean;
  qrCodeSize: number;
  currency: string;
}

export class ReceiptService {
  private qrCodeService: QRCodeService;

  constructor(qrCodeService: QRCodeService) {
    this.qrCodeService = qrCodeService;
  }

  /**
   * Generate receipt HTML
   */
  async generateReceiptHTML(
    data: ReceiptData,
    config: ReceiptConfig
  ): Promise<string> {
    const itemsHTML = data.items
      .map(
        (item) => `
      <tr>
        <td>${item.name}</td>
        <td style="text-align: center;">${item.quantity}</td>
        <td style="text-align: right;">${item.unitPrice.toLocaleString()}</td>
        <td style="text-align: right;">${item.total.toLocaleString()}</td>
      </tr>
      ${
        item.description && config.showItemDescription
          ? `<tr><td colspan="4" style="font-size: 0.8em; color: #666;">${item.description}</td></tr>`
          : ""
      }
    `
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'Courier New', monospace;
            margin: 0;
            padding: 10px;
            width: ${config.receiptWidth}mm;
            font-size: 12px;
          }
          .receipt {
            text-align: center;
          }
          .header {
            margin-bottom: 10px;
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
          }
          .logo {
            max-width: 60px;
            margin-bottom: 5px;
          }
          .business-name {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 3px;
          }
          .business-info {
            font-size: 10px;
            color: #666;
            margin-bottom: 5px;
          }
          .receipt-number {
            font-size: 11px;
            margin-bottom: 5px;
          }
          .items {
            width: 100%;
            margin: 10px 0;
            text-align: left;
            font-size: 11px;
          }
          .items th {
            border-bottom: 1px solid #000;
            padding: 3px 0;
            font-weight: bold;
            text-align: left;
          }
          .items td {
            padding: 2px 0;
          }
          .totals {
            margin: 10px 0;
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
            padding: 5px 0;
            text-align: right;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin: 3px 0;
            font-size: 11px;
          }
          .total-amount {
            font-weight: bold;
            font-size: 13px;
            margin-top: 5px;
          }
          .payment-info {
            margin: 10px 0;
            padding: 5px 0;
            border-top: 1px dashed #000;
            font-size: 10px;
          }
          .qr-code {
            margin: 10px 0;
            text-align: center;
          }
          .qr-code img {
            max-width: ${config.qrCodeSize}px;
            max-height: ${config.qrCodeSize}px;
          }
          .footer {
            margin-top: 10px;
            padding-top: 5px;
            border-top: 1px dashed #000;
            font-size: 9px;
            color: #666;
            text-align: center;
          }
          .timestamp {
            font-size: 10px;
            color: #999;
            margin-top: 5px;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            ${
              config.businessLogo
                ? `<img src="${config.businessLogo}" class="logo" alt="Logo">`
                : ""
            }
            <div class="business-name">${config.businessName}</div>
            ${
              config.businessPhone
                ? `<div class="business-info">Tel: ${config.businessPhone}</div>`
                : ""
            }
            ${
              config.businessAddress
                ? `<div class="business-info">${config.businessAddress}</div>`
                : ""
            }
          </div>

          <div class="receipt-number">
            Receipt #${data.receiptNumber}<br>
            ${data.transactionType.toUpperCase()}
          </div>

          <table class="items">
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHTML}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>${data.subtotal.toLocaleString()} ${config.currency}</span>
            </div>
            ${
              data.tax > 0
                ? `
              <div class="total-row">
                <span>Tax:</span>
                <span>${data.tax.toLocaleString()} ${config.currency}</span>
              </div>
            `
                : ""
            }
            <div class="total-row total-amount">
              <span>Total:</span>
              <span>${data.total.toLocaleString()} ${config.currency}</span>
            </div>
          </div>

          <div class="payment-info">
            <div>Payment Method: ${data.paymentMethod}</div>
            <div>Amount Paid: ${data.amountPaid.toLocaleString()} ${config.currency}</div>
            ${
              data.change > 0
                ? `<div>Change: ${data.change.toLocaleString()} ${config.currency}</div>`
                : ""
            }
          </div>

          ${
            config.showQRCode && data.qrCodeImage
              ? `
            <div class="qr-code">
              <img src="data:image/png;base64,${data.qrCodeImage}" alt="Receipt QR Code">
              <div style="font-size: 9px; margin-top: 3px;">Scan for details</div>
            </div>
          `
              : ""
          }

          <div class="footer">
            ${config.footer || "Thank you for your purchase!"}
            <div class="timestamp">${data.issuedAt.toLocaleString()}</div>
          </div>
        </div>
      </body>
      </html>
    `;

    return html;
  }

  /**
   * Generate receipt with QR code
   */
  async generateReceipt(
    data: ReceiptData,
    config: ReceiptConfig,
    baseUrl: string
  ): Promise<{
    html: string;
    qrCode: string;
  }> {
    // Generate QR code
    const qrToken = this.qrCodeService.generateToken();
    const qrCode = await this.qrCodeService.generateReceiptQRCode(
      data.transactionId,
      qrToken,
      baseUrl,
      {
        width: config.qrCodeSize,
      }
    );

    // Add QR code to receipt data
    data.qrCodeImage = qrCode.base64;
    data.qrCodeUrl = `${baseUrl}/receipt/${qrToken}`;

    // Generate HTML
    const html = await this.generateReceiptHTML(data, config);

    return {
      html,
      qrCode: qrCode.base64,
    };
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number, currency: string): string {
    return `${amount.toLocaleString()} ${currency}`;
  }

  /**
   * Calculate totals
   */
  calculateTotals(items: ReceiptItem[], taxRate: number = 0): {
    subtotal: number;
    tax: number;
    total: number;
  } {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    return { subtotal, tax, total };
  }

  /**
   * Validate receipt data
   */
  validateReceiptData(data: ReceiptData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.receiptNumber) errors.push("Receipt number is required");
    if (!data.transactionId) errors.push("Transaction ID is required");
    if (!data.items || data.items.length === 0) errors.push("At least one item is required");
    if (data.total <= 0) errors.push("Total must be greater than 0");
    if (data.amountPaid < data.total) errors.push("Amount paid must be >= total");

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Create receipt service instance
 */
export function createReceiptService(
  qrCodeService: QRCodeService
): ReceiptService {
  return new ReceiptService(qrCodeService);
}
