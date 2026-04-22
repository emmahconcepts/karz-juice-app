/**
 * Email Notification Service
 * Handles sending emails for reconciliation summaries and payment failures
 */

import nodemailer, { Transporter } from "nodemailer";

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
}

export interface ReconciliationSummaryData {
  date: Date;
  totalTransactions: number;
  matchedTransactions: number;
  unmatchedTransactions: number;
  disputedTransactions: number;
  totalAmount: number;
  matchedAmount: number;
  unmatchedAmount: number;
  failedTransactions: number;
  reversedTransactions: number;
  successRate: number;
  currency: string;
}

export interface PaymentFailureData {
  transactionId: string;
  amount: number;
  currency: string;
  payerPhone: string;
  failureReason: string;
  timestamp: Date;
}

export class EmailService {
  private transporter: Transporter | null = null;
  private isConfigured: boolean = false;

  /**
   * Initialize email service with SMTP configuration
   */
  async initialize(config: {
    host: string;
    port: number;
    user: string;
    password: string;
    fromEmail: string;
    fromName?: string;
    useTLS?: boolean;
    useSSL?: boolean;
  }): Promise<void> {
    try {
      this.transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.useSSL || config.port === 465,
        auth: {
          user: config.user,
          pass: config.password,
        },
        tls: {
          rejectUnauthorized: !config.useTLS,
        },
      });

      // Verify connection
      await this.transporter.verify();
      this.isConfigured = true;
      console.log("[Email] Service initialized successfully");
    } catch (error) {
      console.error("[Email] Failed to initialize:", error);
      throw new Error(
        `Email service initialization failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Send email
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    if (!this.isConfigured || !this.transporter) {
      throw new Error("Email service not configured");
    }

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM_EMAIL || "noreply@karzjuice.local",
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
      });

      console.log(`[Email] Sent to ${Array.isArray(options.to) ? options.to.join(", ") : options.to}`);
    } catch (error) {
      console.error("[Email] Failed to send:", error);
      throw new Error(
        `Failed to send email: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Generate reconciliation summary email
   */
  generateReconciliationSummaryEmail(data: ReconciliationSummaryData): {
    subject: string;
    html: string;
    text: string;
  } {
    const dateStr = data.date.toLocaleDateString("en-UG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const subject = `Daily Reconciliation Summary - ${dateStr}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f97316; color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
            .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
            .summary-card { background-color: #f5f5f5; padding: 15px; border-radius: 5px; border-left: 4px solid #f97316; }
            .summary-card h3 { margin: 0 0 10px 0; font-size: 12px; color: #666; text-transform: uppercase; }
            .summary-card .value { font-size: 24px; font-weight: bold; color: #333; }
            .summary-card .unit { font-size: 12px; color: #999; }
            .status-success { color: #22c55e; }
            .status-warning { color: #eab308; }
            .status-error { color: #ef4444; }
            .footer { color: #999; font-size: 12px; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Daily Reconciliation Summary</h1>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">${dateStr}</p>
            </div>

            <div class="summary-grid">
              <div class="summary-card">
                <h3>Total Transactions</h3>
                <div class="value">${data.totalTransactions}</div>
              </div>
              <div class="summary-card">
                <h3>Matched</h3>
                <div class="value status-success">${data.matchedTransactions}</div>
                <div class="unit">${data.successRate.toFixed(1)}% success rate</div>
              </div>
              <div class="summary-card">
                <h3>Total Amount</h3>
                <div class="value">${data.totalAmount.toLocaleString()} ${data.currency}</div>
              </div>
              <div class="summary-card">
                <h3>Matched Amount</h3>
                <div class="value status-success">${data.matchedAmount.toLocaleString()} ${data.currency}</div>
              </div>
              <div class="summary-card">
                <h3>Unmatched</h3>
                <div class="value status-warning">${data.unmatchedTransactions}</div>
                <div class="unit">${data.unmatchedAmount.toLocaleString()} ${data.currency}</div>
              </div>
              <div class="summary-card">
                <h3>Issues</h3>
                <div class="value status-error">${data.failedTransactions + data.disputedTransactions}</div>
                <div class="unit">${data.failedTransactions} failed, ${data.disputedTransactions} disputed</div>
              </div>
            </div>

            <div style="background-color: #f0f9ff; padding: 15px; border-radius: 5px; border-left: 4px solid #3b82f6;">
              <h3 style="margin: 0 0 10px 0; color: #1e40af;">Key Metrics</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Success Rate: <strong>${data.successRate.toFixed(1)}%</strong></li>
                <li>Reversed Transactions: <strong>${data.reversedTransactions}</strong></li>
                <li>Average Match Time: <strong>~${Math.round(data.totalTransactions > 0 ? 0 : 0)}s</strong></li>
              </ul>
            </div>

            <div class="footer">
              <p>This is an automated message from Karz Juice Management System. Please do not reply to this email.</p>
              <p>For support, contact your system administrator.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Daily Reconciliation Summary - ${dateStr}

Total Transactions: ${data.totalTransactions}
Matched: ${data.matchedTransactions} (${data.successRate.toFixed(1)}%)
Unmatched: ${data.unmatchedTransactions} (${data.unmatchedAmount.toLocaleString()} ${data.currency})

Total Amount: ${data.totalAmount.toLocaleString()} ${data.currency}
Matched Amount: ${data.matchedAmount.toLocaleString()} ${data.currency}

Failed Transactions: ${data.failedTransactions}
Disputed Transactions: ${data.disputedTransactions}
Reversed Transactions: ${data.reversedTransactions}

---
This is an automated message from Karz Juice Management System.
    `;

    return { subject, html, text };
  }

  /**
   * Generate payment failure email
   */
  generatePaymentFailureEmail(data: PaymentFailureData): {
    subject: string;
    html: string;
    text: string;
  } {
    const subject = `⚠️ Payment Failure Alert - ${data.transactionId}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .alert { background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            .alert h2 { margin: 0 0 10px 0; color: #991b1b; }
            .details { background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e5e5; }
            .detail-row:last-child { border-bottom: none; }
            .label { color: #666; font-weight: bold; }
            .value { color: #333; }
            .action-button { display: inline-block; background-color: #f97316; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px; }
            .footer { color: #999; font-size: 12px; margin-top: 20px; border-top: 1px solid #ddd; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="alert">
              <h2>⚠️ Payment Processing Failed</h2>
              <p>A payment transaction has failed and requires immediate attention.</p>
            </div>

            <div class="details">
              <div class="detail-row">
                <span class="label">Transaction ID:</span>
                <span class="value">${data.transactionId}</span>
              </div>
              <div class="detail-row">
                <span class="label">Amount:</span>
                <span class="value">${data.amount.toLocaleString()} ${data.currency}</span>
              </div>
              <div class="detail-row">
                <span class="label">Payer Phone:</span>
                <span class="value">${data.payerPhone}</span>
              </div>
              <div class="detail-row">
                <span class="label">Failure Reason:</span>
                <span class="value">${data.failureReason}</span>
              </div>
              <div class="detail-row">
                <span class="label">Time:</span>
                <span class="value">${data.timestamp.toLocaleString("en-UG")}</span>
              </div>
            </div>

            <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; border-left: 4px solid #f59e0b;">
              <h3 style="margin: 0 0 10px 0; color: #92400e;">Recommended Actions</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Review the failure reason and contact the payer if necessary</li>
                <li>Retry the transaction or request an alternative payment method</li>
                <li>Update the transaction status in the system</li>
              </ul>
            </div>

            <div class="footer">
              <p>This is an automated alert from Karz Juice Management System. Please do not reply to this email.</p>
              <p>For support, contact your system administrator.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
⚠️ PAYMENT PROCESSING FAILED

Transaction ID: ${data.transactionId}
Amount: ${data.amount.toLocaleString()} ${data.currency}
Payer Phone: ${data.payerPhone}
Failure Reason: ${data.failureReason}
Time: ${data.timestamp.toLocaleString("en-UG")}

Recommended Actions:
1. Review the failure reason and contact the payer if necessary
2. Retry the transaction or request an alternative payment method
3. Update the transaction status in the system

---
This is an automated alert from Karz Juice Management System.
    `;

    return { subject, html, text };
  }

  /**
   * Check if email service is configured
   */
  isReady(): boolean {
    return this.isConfigured;
  }
}

/**
 * Create email service instance
 */
export function createEmailService(): EmailService {
  return new EmailService();
}
