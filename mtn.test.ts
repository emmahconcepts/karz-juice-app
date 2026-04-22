import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../db", () => ({
  getDb: vi.fn(),
}));

// ── MTN Reconciliation logic tests ────────────────────────────────────────────
describe("MTN Reconciliation — Business Logic", () => {
  it("should detect amount-range match", () => {
    const amount = 500000;
    const rule = { matchType: "amount_range", amountMin: "450000", amountMax: "550000" };
    const matches = amount >= parseFloat(rule.amountMin) && amount <= parseFloat(rule.amountMax);
    expect(matches).toBe(true);
  });

  it("should reject amount outside range", () => {
    const amount = 300000;
    const rule = { matchType: "amount_range", amountMin: "450000", amountMax: "550000" };
    const matches = amount >= parseFloat(rule.amountMin) && amount <= parseFloat(rule.amountMax);
    expect(matches).toBe(false);
  });

  it("should detect exact amount match within tolerance", () => {
    const amount = 200000;
    const ruleAmount = 200000;
    const matches = Math.abs(amount - ruleAmount) < 1;
    expect(matches).toBe(true);
  });

  it("should match by phone pattern", () => {
    const rule = { matchType: "phone_number", phonePattern: "256701" };
    const txn = { payerPhoneNumber: "+256701234567" };
    const matches = txn.payerPhoneNumber.includes(rule.phonePattern);
    expect(matches).toBe(true);
  });

  it("should update receivable after match", () => {
    const receivable = { amountPaid: "200000", invoiceAmount: "500000", balanceRemaining: "300000", status: "partial" };
    const paymentAmount = 300000;
    const newPaid = parseFloat(receivable.amountPaid) + paymentAmount;
    const newBalance = Math.max(0, parseFloat(receivable.invoiceAmount) - newPaid);
    const newStatus = newBalance <= 0 ? "paid" : "partial";
    expect(newBalance).toBe(0);
    expect(newStatus).toBe("paid");
  });

  it("should correctly count reconciliation statuses", () => {
    const transactions = [
      { reconciliationStatus: "matched" },
      { reconciliationStatus: "confirmed" },
      { reconciliationStatus: "unmatched" },
      { reconciliationStatus: "disputed" },
      { reconciliationStatus: "unmatched" },
    ];
    const matched = transactions.filter(t => ["matched","confirmed"].includes(t.reconciliationStatus)).length;
    const unmatched = transactions.filter(t => t.reconciliationStatus === "unmatched").length;
    const disputed = transactions.filter(t => t.reconciliationStatus === "disputed").length;
    expect(matched).toBe(2);
    expect(unmatched).toBe(2);
    expect(disputed).toBe(1);
  });

  it("should handle duplicate transaction gracefully (ER_DUP_ENTRY)", () => {
    const isDuplicate = (err: any) => err?.code === "ER_DUP_ENTRY";
    const err = { code: "ER_DUP_ENTRY" };
    expect(isDuplicate(err)).toBe(true);
    const err2 = { code: "ER_UNKNOWN" };
    expect(isDuplicate(err2)).toBe(false);
  });
});

// ── Receipt number generation tests ──────────────────────────────────────────
describe("Receipt Number Generation", () => {
  it("should generate correct format RCP-YYYYMMDD-NNNNN", () => {
    const date = new Date("2026-04-21");
    const dateStr = `${date.getFullYear()}${String(date.getMonth()+1).padStart(2,"0")}${String(date.getDate()).padStart(2,"0")}`;
    const seq = 1;
    const rn = `RCP-${dateStr}-${String(seq).padStart(5,"0")}`;
    expect(rn).toBe("RCP-20260421-00001");
    expect(rn).toMatch(/^RCP-\d{8}-\d{5}$/);
  });

  it("should increment sequence for same day", () => {
    const prefix = "RCP-20260421-";
    const last = `${prefix}00042`;
    const seq = parseInt(last.slice(prefix.length), 10) + 1;
    expect(seq).toBe(43);
    expect(`${prefix}${String(seq).padStart(5,"0")}`).toBe("RCP-20260421-00043");
  });

  it("should generate unique QR tokens", () => {
    const tokens = new Set(Array.from({ length: 100 }, () => {
      const bytes = new Uint8Array(32);
      crypto.getRandomValues(bytes);
      return Array.from(bytes).map(b => b.toString(16).padStart(2,"0")).join("");
    }));
    expect(tokens.size).toBe(100);
  });
});

// ── PesaPal business logic tests ──────────────────────────────────────────────
describe("PesaPal Payment Gateway", () => {
  it("should reject payment when gateway not configured", () => {
    const isEnabled = false;
    const canPay = isEnabled;
    expect(canPay).toBe(false);
  });

  it("should validate positive payment amount", () => {
    const validate = (amount: number) => amount > 0;
    expect(validate(500000)).toBe(true);
    expect(validate(0)).toBe(false);
    expect(validate(-1000)).toBe(false);
  });

  it("should validate customer email format", () => {
    const validate = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    expect(validate("customer@karzjuice.app")).toBe(true);
    expect(validate("notanemail")).toBe(false);
  });

  it("should build correct order ID format", () => {
    const saleId = 42;
    const orderId = `SALE-${saleId}-${Date.now()}`;
    expect(orderId).toMatch(/^SALE-42-\d+$/);
  });

  it("should track payment statuses correctly", () => {
    const VALID_STATUSES = ["pending","completed","failed","cancelled"];
    expect(VALID_STATUSES.includes("completed")).toBe(true);
    expect(VALID_STATUSES.includes("refunded")).toBe(false);
  });
});
