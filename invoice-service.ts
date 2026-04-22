/**
 * Invoice Service
 * Generates PDF invoices from receipt data
 */

import { jsPDF } from "jspdf";
import type { ClientReceipt } from "../../drizzle/schema";

export interface InvoiceGenerationOptions {
  businessName?: string;
  businessPhone?: string;
  businessAddress?: string;
  businessEmail?: string;
  footer?: string;
}

export class InvoiceService {
  /**
   * Generate PDF invoice from receipt
   */
  async generateInvoicePDF(
    receipt: ClientReceipt,
    options: InvoiceGenerationOptions = {}
  ): Promise<Buffer> {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;

      let yPosition = margin;

      // Header
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text(options.businessName || "Karz Juice", margin, yPosition);
      yPosition += 10;

      // Invoice title
      doc.setFontSize(14);
      doc.text("RECEIPT", margin, yPosition);
      yPosition += 8;

      // Divider line
      doc.setDrawColor(200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;

      // Receipt details
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      // Left column
      doc.setFont("helvetica", "bold");
      doc.text("Receipt Number:", margin, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(receipt.receiptNumber, margin + 50, yPosition);
      yPosition += 6;

      doc.setFont("helvetica", "bold");
      doc.text("Date:", margin, yPosition);
      doc.setFont("helvetica", "normal");
      const receiptDate = new Date(receipt.receiptDate);
      doc.text(receiptDate.toLocaleDateString(), margin + 50, yPosition);
      yPosition += 6;

      doc.setFont("helvetica", "bold");
      doc.text("Payment Method:", margin, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(receipt.paymentMethod.replace(/_/g, " ").toUpperCase(), margin + 50, yPosition);
      yPosition += 10;

      // Customer info
      doc.setFont("helvetica", "bold");
      doc.text("Bill To:", margin, yPosition);
      yPosition += 6;

      doc.setFont("helvetica", "normal");
      doc.text(receipt.clientName, margin + 5, yPosition);
      yPosition += 6;

      if (receipt.eventReference) {
        doc.text(`Event: ${receipt.eventReference}`, margin + 5, yPosition);
        yPosition += 6;
      }

      yPosition += 4;

      // Divider line
      doc.setDrawColor(200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 6;

      // Amount section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Amount Paid:", margin, yPosition);

      const amountText = this.formatCurrency(Number(receipt.amountPaid));
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(amountText, pageWidth - margin - doc.getTextWidth(amountText), yPosition);
      yPosition += 10;

      // Divider line
      doc.setDrawColor(200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 6;

      // Footer
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);

      if (options.businessPhone) {
        doc.text(`Phone: ${options.businessPhone}`, margin, yPosition);
        yPosition += 5;
      }

      if (options.businessAddress) {
        doc.text(`Address: ${options.businessAddress}`, margin, yPosition);
        yPosition += 5;
      }

      if (options.businessEmail) {
        doc.text(`Email: ${options.businessEmail}`, margin, yPosition);
        yPosition += 5;
      }

      yPosition += 3;

      if (options.footer) {
        doc.setTextColor(150);
        doc.setFontSize(8);
        const footerLines = doc.splitTextToSize(options.footer, contentWidth);
        doc.text(footerLines, margin, yPosition);
      }

      // Add verification text
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text("This receipt is valid and verified.", margin, pageHeight - margin - 5);

      // Convert to buffer
      const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
      return pdfBuffer;
    } catch (error) {
      throw new Error(
        `Failed to generate invoice PDF: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Format currency
   */
  private formatCurrency(amount: number, currency: string = "UGX"): string {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  }
}

/**
 * Create invoice service instance
 */
export function createInvoiceService(): InvoiceService {
  return new InvoiceService();
}
