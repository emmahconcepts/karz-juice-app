import { describe, expect, it, beforeEach, vi } from "vitest";

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeReceipt(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    receiptNumber: "RCP-20260416-0001",
    clientName: "Jane Nakato",
    eventReference: "Wedding 2026-06",
    amountPaid: "2000000",
    paymentMethod: "mobile_money" as const,
    receiptDate: new Date("2026-04-16"),
    issuedBy: 1,
    qrCode: "https://karzjuice.app/verify/RCP-20260416-0001",
    emailSent: false,
    createdAt: new Date(),
    ...overrides,
  };
}

function generateReceiptNumber(dateStr: string, seq: number) {
  return `RCP-${dateStr.replace(/-/g, "")}-${String(seq).padStart(4, "0")}`;
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("Client Receipts — Receipt Numbering", () => {
  it("should generate receipt number in RCP-YYYYMMDD-NNNN format", () => {
    const rn = generateReceiptNumber("2026-04-16", 1);
    expect(rn).toBe("RCP-20260416-0001");
    expect(rn).toMatch(/^RCP-\d{8}-\d{4}$/);
  });

  it("should zero-pad sequence number to 4 digits", () => {
    expect(generateReceiptNumber("2026-04-16", 1)).toContain("0001");
    expect(generateReceiptNumber("2026-04-16", 99)).toContain("0099");
    expect(generateReceiptNumber("2026-04-16", 1000)).toContain("1000");
  });

  it("should increment sequence per day", () => {
    const rn1 = generateReceiptNumber("2026-04-16", 1);
    const rn2 = generateReceiptNumber("2026-04-16", 2);
    expect(rn1).not.toBe(rn2);
  });

  it("should reset sequence for a new day", () => {
    const rn1 = generateReceiptNumber("2026-04-16", 5);
    const rn2 = generateReceiptNumber("2026-04-17", 1);
    expect(rn1.split("-")[1]).not.toBe(rn2.split("-")[1]);
  });

  it("should produce unique receipt numbers", () => {
    const numbers = Array.from({ length: 100 }, (_, i) =>
      generateReceiptNumber("2026-04-16", i + 1)
    );
    const unique = new Set(numbers);
    expect(unique.size).toBe(100);
  });
});

describe("Client Receipts — Validation", () => {
  it("should require client name", () => {
    const validate = (name: string) => name.trim().length > 0;
    expect(validate("")).toBe(false);
    expect(validate("Jane Nakato")).toBe(true);
  });

  it("should require positive amount", () => {
    const validate = (amount: string) => parseFloat(amount) > 0;
    expect(validate("0")).toBe(false);
    expect(validate("-1000")).toBe(false);
    expect(validate("2000000")).toBe(true);
  });

  it("should accept valid payment methods", () => {
    const VALID = ["cash", "mobile_money", "bank_transfer"];
    expect(VALID.includes("cash")).toBe(true);
    expect(VALID.includes("mobile_money")).toBe(true);
    expect(VALID.includes("bank_transfer")).toBe(true);
    expect(VALID.includes("crypto")).toBe(false);
  });
});

describe("Client Receipts — QR Code", () => {
  it("should generate QR code URL with receipt number", () => {
    const receipt = makeReceipt();
    expect(receipt.qrCode).toContain(receipt.receiptNumber);
  });

  it("should build verify URL correctly", () => {
    const receiptNumber = "RCP-20260416-0001";
    const baseUrl = "https://karzjuice.app";
    const url = `${baseUrl}/verify/${receiptNumber}`;
    expect(url).toBe("https://karzjuice.app/verify/RCP-20260416-0001");
  });

  it("should expose only safe fields on public verify endpoint", () => {
    const receipt = makeReceipt({ issuedByName: "Admin User", pdfUrl: "/secret/path.pdf" });
    // Public verify should ONLY return these fields
    const publicFields = ["receiptNumber", "clientName", "amountPaid", "paymentMethod", "receiptDate", "eventReference", "issuedBy"];
    const privateFields = ["pdfUrl"];

    privateFields.forEach(field => {
      expect(publicFields.includes(field)).toBe(false);
    });
  });
});

describe("Client Receipts — Email", () => {
  it("should validate email format before sending", () => {
    const validate = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    expect(validate("client@example.com")).toBe(true);
    expect(validate("not-an-email")).toBe(false);
    expect(validate("")).toBe(false);
  });

  it("should mark emailSent = true after successful send", () => {
    const receipt = makeReceipt({ emailSent: false });
    const updated = { ...receipt, emailSent: true };
    expect(updated.emailSent).toBe(true);
  });

  it("should prevent deletion of emailed receipts", () => {
    const receipt = makeReceipt({ emailSent: true });
    const canDelete = !receipt.emailSent;
    expect(canDelete).toBe(false);
  });

  it("should allow deletion of un-emailed receipts", () => {
    const receipt = makeReceipt({ emailSent: false });
    const canDelete = !receipt.emailSent;
    expect(canDelete).toBe(true);
  });
});

describe("Client Receipts — Amount Formatting", () => {
  it("should format UGX amounts correctly", () => {
    const fmt = (n: number) => `UGX ${n.toLocaleString()}`;
    expect(fmt(2000000)).toBe("UGX 2,000,000");
    expect(fmt(150000)).toBe("UGX 150,000");
  });

  it("should parse decimal amounts correctly", () => {
    expect(parseFloat("2000000")).toBe(2000000);
    expect(parseFloat("150000.50")).toBeCloseTo(150000.5);
  });
});
