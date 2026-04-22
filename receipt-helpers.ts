/**
 * Receipt Helper Utilities — Complete Implementation
 * Auto-generates sequenced receipt numbers from DB and wires into sales
 */
import { ReceiptData, ReceiptConfig } from "./receipt-service";
import { getDb } from "../db";
import { clientReceipts, qrCodeLinks } from "../../drizzle/schema";
import { desc, like } from "drizzle-orm";
import crypto from "crypto";

/** Generate sequential receipt number: RCP-YYYYMMDD-NNNNN */
export async function generateReceiptNumber(): Promise<string> {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth()+1).padStart(2,"0")}${String(date.getDate()).padStart(2,"0")}`;
  const prefix = `RCP-${dateStr}-`;

  const db = await getDb();
  let seq = 1;
  if (db) {
    try {
      const rows = await db.select({ rn: clientReceipts.receiptNumber })
        .from(clientReceipts)
        .where(like(clientReceipts.receiptNumber, `${prefix}%`))
        .orderBy(desc(clientReceipts.receiptNumber))
        .limit(1);
      if (rows.length) {
        const last = parseInt(rows[0].rn.slice(prefix.length), 10);
        if (!isNaN(last)) seq = last + 1;
      }
    } catch { /* fall back to timestamp-based */ seq = Date.now() % 100000; }
  } else {
    seq = Date.now() % 100000;
  }
  return `${prefix}${String(seq).padStart(5, "0")}`;
}

/** Convert a sale to ReceiptData shape */
export function convertSaleToReceiptData(
  sale: { id: string; customerName?: string; customerPhone?: string; items: Array<{ productName: string; quantity: number; unitPrice: number; total: number }>; subtotal: number; tax: number; total: number; amountPaid: number; paymentMethod: string; createdAt: Date },
  receiptNumber: string
): ReceiptData {
  return {
    receiptNumber, transactionId: sale.id, transactionType: "sale", issuedAt: sale.createdAt,
    items: sale.items.map(i => ({ name: i.productName, quantity: i.quantity, unitPrice: i.unitPrice, total: i.total })),
    subtotal: sale.subtotal, tax: sale.tax, total: sale.total, amountPaid: sale.amountPaid,
    change: sale.amountPaid - sale.total, paymentMethod: sale.paymentMethod,
    customerName: sale.customerName, customerPhone: sale.customerPhone,
  };
}

/** Default receipt config from env */
export function getDefaultReceiptConfig(): ReceiptConfig {
  return {
    businessName: process.env.BUSINESS_NAME || "Karz Juice",
    businessPhone: process.env.BUSINESS_PHONE || "+256 700 123 456",
    businessEmail: process.env.BUSINESS_EMAIL || "info@karzjuice.app",
    businessAddress: process.env.BUSINESS_ADDRESS || "Kampala, Uganda",
    footer: "Thank you for your purchase! Scan QR code to verify.",
    receiptWidth: 80, showItemDescription: true, showQRCode: true, qrCodeSize: 100, currency: "UGX",
  };
}

/** Generate a cryptographically unique QR token */
export function generateQRToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/** Generate receipt metadata including QR token and save QR link to DB */
export async function generateReceiptMetadata(
  transactionId: string,
  receiptNumber: string,
  receiptDbId?: number
): Promise<{ receiptId: string; qrToken: string; metadata: Record<string, unknown> }> {
  const qrToken = generateQRToken();

  // Save QR code link to database if we have the receipt ID
  if (receiptDbId) {
    const db = await getDb();
    if (db) {
      try {
        await db.insert(qrCodeLinks).values({
          receiptId: receiptDbId,
          token: qrToken,
          isPublic: true,
          accessCount: 0,
        });
      } catch (e) { console.warn("[QR] Failed to save link:", e); }
    }
  }

  return {
    receiptId: `RCPT-${Date.now()}`,
    qrToken,
    metadata: { generatedAt: new Date().toISOString(), transactionId, receiptNumber, version: "1.0" },
  };
}

/** Calculate receipt totals with optional tax rate */
export function calculateReceiptTotals(items: Array<{ quantity: number; unitPrice: number }>, taxRate = 0) {
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const tax = subtotal * taxRate;
  return { subtotal, tax, total: subtotal + tax };
}

export function formatCurrencyForReceipt(amount: number, currency = "UGX") {
  return `${amount.toLocaleString()} ${currency}`;
}

export function validateSaleForReceipt(sale: { items?: Array<{ quantity: number; unitPrice: number }>; total?: number; amountPaid?: number }): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!sale.items?.length) errors.push("Sale must have at least one item");
  if (!sale.total || sale.total <= 0) errors.push("Sale total must be > 0");
  if (!sale.amountPaid || sale.amountPaid < (sale.total || 0)) errors.push("Amount paid must be >= total");
  return { valid: errors.length === 0, errors };
}

export function formatReceiptForDisplay(receipt: ReceiptData): string {
  const lines: string[] = [];
  lines.push("=".repeat(40), "RECEIPT".padStart(25), "=".repeat(40), "");
  lines.push(`Receipt #: ${receipt.receiptNumber}`, `Date: ${receipt.issuedAt.toLocaleString()}`, "");
  if (receipt.customerName) lines.push(`Customer: ${receipt.customerName}`);
  if (receipt.customerPhone) lines.push(`Phone: ${receipt.customerPhone}`);
  lines.push("", "-".repeat(40));
  receipt.items.forEach(item => {
    lines.push(item.name, `  ${item.quantity} x ${item.unitPrice.toLocaleString()} = ${item.total.toLocaleString()}`);
  });
  lines.push("", "-".repeat(40));
  lines.push(`Subtotal: ${receipt.subtotal.toLocaleString()}`);
  if (receipt.tax > 0) lines.push(`Tax: ${receipt.tax.toLocaleString()}`);
  lines.push(`Total: ${receipt.total.toLocaleString()}`, `Paid: ${receipt.amountPaid.toLocaleString()}`);
  if (receipt.change > 0) lines.push(`Change: ${receipt.change.toLocaleString()}`);
  lines.push("", `Payment: ${receipt.paymentMethod}`, "", "=".repeat(40));
  return lines.join("\n");
}
