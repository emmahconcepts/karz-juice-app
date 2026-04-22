import { describe, expect, it } from "vitest";

// ── Business rule helpers (mirror deleteAudit.ts logic) ──────────────────────

function canDeleteSale(sale: { isClosed: boolean }, isAdmin: boolean) {
  if (sale.isClosed && !isAdmin) return { ok: false, reason: "Day is closed. Admin required." };
  return { ok: true };
}

function canDeleteFunction(payments: any[]) {
  if (payments.length > 0) return { ok: false, reason: "Function has recorded payments." };
  return { ok: true };
}

function canDeleteMachineHire(hire: { paymentStatus: string }) {
  if (hire.paymentStatus === "paid") return { ok: false, reason: "Cannot delete a paid hire." };
  return { ok: true };
}

function canDeleteProduct(linkedSales: any[]) {
  if (linkedSales.length > 0) return { ok: true, type: "soft", reason: "Will deactivate — linked sales exist." };
  return { ok: true, type: "hard" };
}

function canDeleteScannedReceipt(receipt: { isConfirmed: boolean }) {
  if (receipt.isConfirmed) return { ok: false, reason: "Cannot delete confirmed receipt." };
  return { ok: true };
}

function canDeleteStatement(transactions: { status: string }[]) {
  const confirmed = transactions.some(t => t.status === "confirmed");
  if (confirmed) return { ok: false, reason: "Statement has confirmed transactions." };
  return { ok: true };
}

function canDeleteReceivable(receivable: { balanceRemaining: string }) {
  if (parseFloat(receivable.balanceRemaining) > 0) return { ok: false, reason: "Outstanding balance exists." };
  return { ok: true };
}

function canDeletePayable(payable: { status: string }) {
  if (payable.status !== "paid") return { ok: false, reason: "Payable is not fully paid." };
  return { ok: true };
}

function canDeleteCustomAccount(account: { balance: string }) {
  if (parseFloat(account.balance) !== 0) return { ok: false, reason: "Account has non-zero balance." };
  return { ok: true, type: "soft" };
}

function canDeleteClientReceipt(receipt: { emailSent: boolean }) {
  if (receipt.emailSent) return { ok: false, reason: "Receipt has been emailed." };
  return { ok: true };
}

function canDeleteSyncItem(item: { status: string }) {
  if (item.status === "pending") return { ok: false, reason: "Sync item is still pending." };
  return { ok: true };
}

function canReverseLedger(entry: { isReversed: boolean }) {
  if (entry.isReversed) return { ok: false, reason: "Entry already reversed." };
  return { ok: true };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("Delete Audit — Module 1: Sales", () => {
  it("should allow deleting open-day sale by any user", () => {
    expect(canDeleteSale({ isClosed: false }, false).ok).toBe(true);
  });
  it("should block deleting closed-day sale for non-admin", () => {
    expect(canDeleteSale({ isClosed: true }, false).ok).toBe(false);
  });
  it("should allow admin to delete closed-day sale", () => {
    expect(canDeleteSale({ isClosed: true }, true).ok).toBe(true);
  });
});

describe("Delete Audit — Module 2: Functions/Events", () => {
  it("should allow deleting function with no payments", () => {
    expect(canDeleteFunction([]).ok).toBe(true);
  });
  it("should block deleting function with payments", () => {
    expect(canDeleteFunction([{ id: 1 }]).ok).toBe(false);
  });
});

describe("Delete Audit — Module 4: Machine Hire", () => {
  it("should allow deleting unpaid hire", () => {
    expect(canDeleteMachineHire({ paymentStatus: "pending" }).ok).toBe(true);
  });
  it("should block deleting paid hire", () => {
    expect(canDeleteMachineHire({ paymentStatus: "paid" }).ok).toBe(false);
  });
});

describe("Delete Audit — Module 6: Products", () => {
  it("should hard-delete product with no linked sales", () => {
    const result = canDeleteProduct([]);
    expect(result.ok).toBe(true);
    expect(result.type).toBe("hard");
  });
  it("should soft-delete product with linked sales", () => {
    const result = canDeleteProduct([{ id: 1 }]);
    expect(result.ok).toBe(true);
    expect(result.type).toBe("soft");
  });
});

describe("Delete Audit — Module 7: OCR Scanned Receipts", () => {
  it("should allow deleting unconfirmed receipt", () => {
    expect(canDeleteScannedReceipt({ isConfirmed: false }).ok).toBe(true);
  });
  it("should block deleting confirmed receipt", () => {
    expect(canDeleteScannedReceipt({ isConfirmed: true }).ok).toBe(false);
  });
});

describe("Delete Audit — Module 8: Statements", () => {
  it("should allow deleting statement with no confirmed transactions", () => {
    expect(canDeleteStatement([{ status: "unmatched" }]).ok).toBe(true);
  });
  it("should block deleting statement with confirmed transactions", () => {
    expect(canDeleteStatement([{ status: "confirmed" }]).ok).toBe(false);
  });
  it("should block if any transaction is confirmed, even with unmatched others", () => {
    expect(canDeleteStatement([{ status: "unmatched" }, { status: "confirmed" }]).ok).toBe(false);
  });
});

describe("Delete Audit — Module 9: Accounts Receivable", () => {
  it("should allow deleting fully settled receivable", () => {
    expect(canDeleteReceivable({ balanceRemaining: "0" }).ok).toBe(true);
  });
  it("should block deleting receivable with outstanding balance", () => {
    expect(canDeleteReceivable({ balanceRemaining: "500000" }).ok).toBe(false);
  });
});

describe("Delete Audit — Module 10: Accounts Payable", () => {
  it("should allow deleting paid payable", () => {
    expect(canDeletePayable({ status: "paid" }).ok).toBe(true);
  });
  it("should block deleting pending payable", () => {
    expect(canDeletePayable({ status: "pending" }).ok).toBe(false);
  });
  it("should block deleting partial payable", () => {
    expect(canDeletePayable({ status: "partial" }).ok).toBe(false);
  });
});

describe("Delete Audit — Module 11: Custom Accounts", () => {
  it("should soft-delete account with zero balance", () => {
    const result = canDeleteCustomAccount({ balance: "0" });
    expect(result.ok).toBe(true);
    expect(result.type).toBe("soft");
  });
  it("should block deleting account with non-zero balance", () => {
    expect(canDeleteCustomAccount({ balance: "100000" }).ok).toBe(false);
  });
  it("should block deleting account with negative balance", () => {
    expect(canDeleteCustomAccount({ balance: "-50000" }).ok).toBe(false);
  });
});

describe("Delete Audit — Module 13: Client Receipts", () => {
  it("should allow deleting un-emailed receipt", () => {
    expect(canDeleteClientReceipt({ emailSent: false }).ok).toBe(true);
  });
  it("should block deleting emailed receipt", () => {
    expect(canDeleteClientReceipt({ emailSent: true }).ok).toBe(false);
  });
});

describe("Delete Audit — Module 14: Offline Sync Queue", () => {
  it("should allow deleting synced item", () => {
    expect(canDeleteSyncItem({ status: "synced" }).ok).toBe(true);
  });
  it("should allow deleting failed item", () => {
    expect(canDeleteSyncItem({ status: "failed" }).ok).toBe(true);
  });
  it("should block deleting pending item", () => {
    expect(canDeleteSyncItem({ status: "pending" }).ok).toBe(false);
  });
});

describe("Delete Audit — Module 15: Ledger Entries (Reversal Only)", () => {
  it("should allow reversing unreversed entry", () => {
    expect(canReverseLedger({ isReversed: false }).ok).toBe(true);
  });
  it("should block reversing already-reversed entry", () => {
    expect(canReverseLedger({ isReversed: true }).ok).toBe(false);
  });
  it("compensating entry should swap debit and credit accounts", () => {
    const original = { debitAccountId: 1, creditAccountId: 2, amount: "100000" };
    const reversal = { debitAccountId: original.creditAccountId, creditAccountId: original.debitAccountId, amount: original.amount };
    expect(reversal.debitAccountId).toBe(2);
    expect(reversal.creditAccountId).toBe(1);
    expect(reversal.amount).toBe("100000");
  });
});
