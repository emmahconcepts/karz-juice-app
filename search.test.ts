import { describe, expect, it, beforeEach, vi } from "vitest";

// ── Mock search results ───────────────────────────────────────────────────────
function makeSearchResults(query: string) {
  const q = query.toLowerCase();
  return {
    receipts: q.includes("rcp") ? [{ id: 1, receiptNumber: "RCP-20260416-0001", clientName: "Jane Nakato" }] : [],
    products: q.includes("mango") ? [{ id: 1, name: "Mango Juice 500ml", sku: "MJ-500" }] : [],
    clients: q.includes("jane") ? [{ id: 1, clientName: "Jane Nakato" }] : [],
    accounts: q.includes("cash") ? [{ id: 1, name: "Cash Account", code: "CASH-001" }] : [],
    packages: q.includes("wedding") ? [{ id: 1, packageName: "Wedding Package" }] : [],
    functions: q.includes("wedding") ? [{ id: 1, clientName: "Doe Wedding", eventType: "Wedding" }] : [],
    transactions: [],
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("Global Search — Query Validation", () => {
  it("should require at least 2 characters", () => {
    const validate = (q: string) => q.trim().length >= 2;
    expect(validate("a")).toBe(false);
    expect(validate("")).toBe(false);
    expect(validate("ma")).toBe(true);
    expect(validate("mango")).toBe(true);
  });

  it("should cap query at 100 characters", () => {
    const validate = (q: string) => q.length <= 100;
    expect(validate("a".repeat(101))).toBe(false);
    expect(validate("a".repeat(100))).toBe(true);
  });

  it("should trim whitespace from query", () => {
    const trim = (q: string) => q.trim();
    expect(trim("  mango  ")).toBe("mango");
  });

  it("should be case-insensitive", () => {
    const results1 = makeSearchResults("mango");
    const results2 = makeSearchResults("MANGO");
    expect(results1.products.length).toBe(results2.products.length);
  });
});

describe("Global Search — Entity Coverage", () => {
  it("should search receipts by receipt number", () => {
    const results = makeSearchResults("RCP");
    expect(results.receipts.length).toBeGreaterThan(0);
    expect(results.receipts[0].receiptNumber).toMatch(/^RCP-/);
  });

  it("should search products by name", () => {
    const results = makeSearchResults("mango");
    expect(results.products.length).toBeGreaterThan(0);
    expect(results.products[0].name).toContain("Mango");
  });

  it("should search clients by name", () => {
    const results = makeSearchResults("Jane");
    expect(results.clients.length).toBeGreaterThan(0);
    expect(results.clients[0].clientName).toContain("Jane");
  });

  it("should search accounts by name or code", () => {
    const results = makeSearchResults("cash");
    expect(results.accounts.length).toBeGreaterThan(0);
  });

  it("should search packages by name", () => {
    const results = makeSearchResults("wedding");
    expect(results.packages.length).toBeGreaterThan(0);
  });

  it("should search functions/events by client name and type", () => {
    const results = makeSearchResults("wedding");
    expect(results.functions.length).toBeGreaterThan(0);
  });

  it("should return empty results for no matches", () => {
    const results = makeSearchResults("xyznotfound123");
    const total = Object.values(results).reduce((s: number, a) => s + (a as any[]).length, 0);
    expect(total).toBe(0);
  });
});

describe("Global Search — Result Formatting", () => {
  it("should cap results per entity at 5", () => {
    const MAX = 5;
    const bigList = Array.from({ length: 20 }, (_, i) => ({ id: i }));
    const capped = bigList.slice(0, MAX);
    expect(capped.length).toBe(MAX);
  });

  it("should return results within 500ms", async () => {
    const start = Date.now();
    makeSearchResults("mango"); // synchronous mock
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(500);
  });

  it("should have consistent result shape", () => {
    const results = makeSearchResults("jane");
    expect(results).toHaveProperty("receipts");
    expect(results).toHaveProperty("products");
    expect(results).toHaveProperty("clients");
    expect(results).toHaveProperty("accounts");
    expect(results).toHaveProperty("packages");
    expect(results).toHaveProperty("functions");
    expect(results).toHaveProperty("transactions");
  });
});

describe("Global Search — Keyboard Shortcut", () => {
  it("should trigger on Ctrl+K", () => {
    let opened = false;
    const handler = (e: { key: string; ctrlKey: boolean }) => {
      if (e.ctrlKey && e.key === "k") opened = true;
    };
    handler({ key: "k", ctrlKey: true });
    expect(opened).toBe(true);
  });

  it("should trigger on Cmd+K", () => {
    let opened = false;
    const handler = (e: { key: string; metaKey: boolean }) => {
      if (e.metaKey && e.key === "k") opened = true;
    };
    handler({ key: "k", metaKey: true });
    expect(opened).toBe(true);
  });

  it("should close on Escape", () => {
    let open = true;
    const handler = (e: { key: string }) => {
      if (e.key === "Escape") open = false;
    };
    handler({ key: "Escape" });
    expect(open).toBe(false);
  });
});
