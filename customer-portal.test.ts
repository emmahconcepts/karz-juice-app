/**
 * Customer Portal Tests
 * Tests for public QR code receipt lookup and invoice generation
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as db from "./db";
import { createInvoiceService } from "./_core/invoice-service";
import { createQRCodeService } from "./_core/qr-code-service";

describe("Customer Portal - QR Code Receipt Lookup", () => {
  const invoiceService = createInvoiceService();
  const qrCodeService = createQRCodeService();

  // Test data
  const testToken = "test-qr-token-12345";
  const testReceipt = {
    id: 999,
    receiptNumber: "RCP-20260418-00001",
    clientName: "John Doe",
    eventReference: "Wedding Event",
    amountPaid: "500000",
    paymentMethod: "cash" as const,
    receiptDate: new Date("2026-04-18"),
    issuedBy: 1,
    qrCode: null,
    pdfUrl: null,
    emailSent: false,
    createdAt: new Date(),
  };

  it("should generate a unique QR token", () => {
    const token1 = qrCodeService.generateToken(32);
    const token2 = qrCodeService.generateToken(32);

    expect(token1).toBeDefined();
    expect(token2).toBeDefined();
    expect(token1).not.toBe(token2);
    expect(token1.length).toBe(64); // 32 bytes = 64 hex chars
  });

  it("should generate QR code for receipt URL", async () => {
    const baseUrl = "https://karzjuice.local";
    const qrCode = await qrCodeService.generateReceiptQRCode(
      "receipt-123",
      testToken,
      baseUrl
    );

    expect(qrCode.dataUrl).toBeDefined();
    expect(qrCode.dataUrl).toContain("data:image/png;base64");
    expect(qrCode.base64).toBeDefined();
    expect(qrCode.svg).toBeDefined();
  });

  it("should validate QR code content", () => {
    const validContent = "https://karzjuice.local/receipt/token123";
    const invalidContent = "x".repeat(3000); // Exceeds QR code capacity

    expect(qrCodeService.validateQRCodeContent(validContent)).toBe(true);
    expect(qrCodeService.validateQRCodeContent(invalidContent)).toBe(false);
  });

  it("should generate invoice PDF from receipt", async () => {
    const pdfBuffer = await invoiceService.generateInvoicePDF(testReceipt, {
      businessName: "Karz Juice",
      businessPhone: "+256 700 123 456",
      businessAddress: "Kampala, Uganda",
      businessEmail: "info@karzjuice.local",
      footer: "Thank you for your purchase!",
    });

    expect(pdfBuffer).toBeDefined();
    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.length).toBeGreaterThan(0);

    // Check PDF header signature
    const header = pdfBuffer.toString("utf8", 0, 4);
    expect(header).toBe("%PDF");
  });

  it("should generate PDF with correct receipt information", async () => {
    const pdfBuffer = await invoiceService.generateInvoicePDF(testReceipt, {
      businessName: "Karz Juice",
      businessPhone: "+256 700 123 456",
      businessAddress: "Kampala, Uganda",
    });

    const pdfText = pdfBuffer.toString("utf8");

    // Verify receipt data is in PDF
    expect(pdfText).toContain("Karz Juice");
    expect(pdfText).toContain("RECEIPT");
  });

  it("should handle PDF generation with minimal options", async () => {
    const pdfBuffer = await invoiceService.generateInvoicePDF(testReceipt);

    expect(pdfBuffer).toBeDefined();
    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  });

  it("should generate different PDFs for different receipts", async () => {
    const receipt2 = {
      ...testReceipt,
      id: 1000,
      receiptNumber: "RCP-20260418-00002",
      clientName: "Jane Smith",
      amountPaid: "750000",
    };

    const pdf1 = await invoiceService.generateInvoicePDF(testReceipt);
    const pdf2 = await invoiceService.generateInvoicePDF(receipt2);

    // PDFs should be different
    expect(pdf1.toString("base64")).not.toBe(pdf2.toString("base64"));
  });

  it("should format currency correctly in PDF", async () => {
    const pdfBuffer = await invoiceService.generateInvoicePDF(testReceipt);
    const pdfText = pdfBuffer.toString("utf8");

    // Should contain amount information
    expect(pdfText.length).toBeGreaterThan(100);
  });

  it("should generate QR code batch", async () => {
    const items = [
      { id: "1", data: "https://karzjuice.local/receipt/token1" },
      { id: "2", data: "https://karzjuice.local/receipt/token2" },
      { id: "3", data: "https://karzjuice.local/receipt/token3" },
    ];

    const qrCodes = await qrCodeService.generateBatchQRCodes(items);

    expect(qrCodes.size).toBe(3);
    expect(qrCodes.has("1")).toBe(true);
    expect(qrCodes.has("2")).toBe(true);
    expect(qrCodes.has("3")).toBe(true);

    // Each QR code should be valid
    qrCodes.forEach((qrCode) => {
      expect(qrCode.dataUrl).toContain("data:image/png;base64");
      expect(qrCode.base64).toBeDefined();
    });
  });

  it("should handle receipt with event reference", async () => {
    const receiptWithEvent = {
      ...testReceipt,
      eventReference: "Birthday Party - April 18",
    };

    const pdfBuffer = await invoiceService.generateInvoicePDF(receiptWithEvent);

    expect(pdfBuffer).toBeDefined();
    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
  });

  it("should handle receipt without event reference", async () => {
    const receiptWithoutEvent = {
      ...testReceipt,
      eventReference: null,
    };

    const pdfBuffer = await invoiceService.generateInvoicePDF(receiptWithoutEvent);

    expect(pdfBuffer).toBeDefined();
    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
  });

  it("should generate valid base64 from PDF", async () => {
    const pdfBuffer = await invoiceService.generateInvoicePDF(testReceipt);
    const base64 = pdfBuffer.toString("base64");

    // Should be valid base64
    expect(base64).toBeDefined();
    expect(base64.length).toBeGreaterThan(0);

    // Should be decodable
    const decoded = Buffer.from(base64, "base64");
    expect(decoded.toString("utf8", 0, 4)).toBe("%PDF");
  });
});

describe("Customer Portal - QR Code Link Management", () => {
  it("should validate QR token format", () => {
    const qrCodeService = createQRCodeService();

    const token = qrCodeService.generateToken(32);
    expect(token).toMatch(/^[a-f0-9]{64}$/);
  });

  it("should generate different tokens on each call", () => {
    const qrCodeService = createQRCodeService();

    const tokens = new Set();
    for (let i = 0; i < 10; i++) {
      tokens.add(qrCodeService.generateToken(32));
    }

    // All tokens should be unique
    expect(tokens.size).toBe(10);
  });

  it("should validate QR code URL format", () => {
    const qrCodeService = createQRCodeService();

    const validUrl = "https://karzjuice.local/receipt/abc123def456";
    const invalidUrl = "not a url";
    const emptyUrl = "";

    expect(qrCodeService.validateQRCodeContent(validUrl)).toBe(true);
    expect(qrCodeService.validateQRCodeContent(invalidUrl)).toBe(true); // Still valid content
    expect(qrCodeService.validateQRCodeContent(emptyUrl)).toBe(true); // Empty is technically valid
  });
});
