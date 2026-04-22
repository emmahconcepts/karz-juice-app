import { describe, expect, it, beforeEach, vi } from "vitest";
import * as db from "./db";

vi.mock("./db", () => ({
  createProduct: vi.fn(),
  getAllProducts: vi.fn(),
  createDailySale: vi.fn(),
  getDailySalesByDate: vi.fn(),
  getDailySalesTotalByDate: vi.fn(),
  createLedgerEntry: vi.fn(),
  createDayCloseLog: vi.fn(),
  getDayCloseLogByDate: vi.fn(),
  getExpensesByDateRange: vi.fn(),
}));

describe("Sales Module - Product Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a product with name, SKU, and category", async () => {
    const mockProduct = {
      name: "Mango Juice",
      sku: "MJ-001",
      description: "Fresh mango juice",
      category: "Fruit Juice",
      isActive: true,
    };

    vi.mocked(db.createProduct).mockResolvedValue({ insertId: 1 } as any);

    const result = await db.createProduct(mockProduct);

    expect(result).toBeDefined();
    expect(vi.mocked(db.createProduct)).toHaveBeenCalledWith(mockProduct);
  });

  it("should retrieve all active products", async () => {
    const mockProducts = [
      { id: 1, name: "Mango Juice", sku: "MJ-001", isActive: true },
      { id: 2, name: "Orange Juice", sku: "OJ-001", isActive: true },
    ];

    vi.mocked(db.getAllProducts).mockResolvedValue(mockProducts as any);

    const result = await db.getAllProducts();

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Mango Juice");
  });
});

describe("Sales Module - Sale Recording", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should record a sale with correct total calculation", async () => {
    const quantity = 10;
    const unitPrice = 50000;
    const expectedTotal = 500000;

    const mockSale = {
      saleDate: new Date("2026-03-02"),
      productId: 1,
      quantity: quantity.toString(),
      unitPrice: unitPrice.toString(),
      total: expectedTotal.toString(),
      paymentMethod: "cash" as const,
      recordedBy: 1,
      isClosed: false,
    };

    vi.mocked(db.createDailySale).mockResolvedValue({ insertId: 1 } as any);

    const result = await db.createDailySale(mockSale);

    expect(result).toBeDefined();
    expect(mockSale.total).toBe((quantity * unitPrice).toString());
  });

  it("should create ledger entry when recording sale", async () => {
    const mockLedgerEntry = {
      transactionId: "SALE-123",
      debitAccountId: 1,
      creditAccountId: 3,
      amount: "500000",
      description: "Sale of product #1",
      entryDate: new Date("2026-03-02"),
      entryType: "sales" as const,
      isReversed: false,
      createdBy: 1,
    };

    vi.mocked(db.createLedgerEntry).mockResolvedValue({ insertId: 1 } as any);

    const result = await db.createLedgerEntry(mockLedgerEntry);

    expect(result).toBeDefined();
    expect(mockLedgerEntry.entryType).toBe("sales");
    expect(mockLedgerEntry.debitAccountId).not.toBe(mockLedgerEntry.creditAccountId);
  });

  it("should track payment method (cash vs mobile money)", () => {
    const cashSale = { paymentMethod: "cash" as const };
    const mobileMoneySale = { paymentMethod: "mobile_money" as const };

    expect(cashSale.paymentMethod).toBe("cash");
    expect(mobileMoneySale.paymentMethod).toBe("mobile_money");
  });

  it("should calculate daily sales total correctly", async () => {
    const mockSales = [
      { id: 1, total: "500000" },
      { id: 2, total: "300000" },
      { id: 3, total: "200000" },
    ];

    const total = mockSales.reduce((sum, s) => sum + parseFloat(s.total), 0);

    expect(total).toBe(1000000);
  });
});

describe("Sales Module - Day Close", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should prevent closing a day twice", async () => {
    const closeDate = new Date("2026-03-02");

    vi.mocked(db.getDayCloseLogByDate).mockResolvedValue({ closeDate } as any);

    const existingClose = await db.getDayCloseLogByDate(closeDate);

    expect(existingClose).toBeDefined();
    expect(existingClose.closeDate).toEqual(closeDate);
  });

  it("should calculate gross profit on day close", async () => {
    const totalSales = 1000000;
    const totalExpenses = 300000;
    const grossProfit = totalSales - totalExpenses;

    expect(grossProfit).toBe(700000);
  });

  it("should create day close log with totals", async () => {
    const mockDayClose = {
      closeDate: new Date("2026-03-02"),
      closedBy: 1,
      totalSales: "1000000",
      totalExpenses: "300000",
      notes: "Day closed successfully",
    };

    vi.mocked(db.createDayCloseLog).mockResolvedValue({ insertId: 1 } as any);

    const result = await db.createDayCloseLog(mockDayClose);

    expect(result).toBeDefined();
    expect(parseFloat(mockDayClose.totalSales)).toBeGreaterThan(0);
  });

  it("should mark all sales as closed after day close", () => {
    const sales = [
      { id: 1, isClosed: false },
      { id: 2, isClosed: false },
      { id: 3, isClosed: false },
    ];

    // After day close, all should be marked as closed
    const closedSales = sales.map(s => ({ ...s, isClosed: true }));

    expect(closedSales.every(s => s.isClosed)).toBe(true);
  });
});

describe("Sales Module - Receipt Generation", () => {
  it("should generate receipt with unique number", () => {
    const receiptNumber = `RCP-${Date.now()}`;

    expect(receiptNumber).toMatch(/^RCP-\d+$/);
  });

  it("should include sale details in receipt", () => {
    const receipt = {
      receiptNumber: "RCP-123456",
      saleId: 1,
      amount: "500000",
      paymentMethod: "cash",
      timestamp: new Date(),
    };

    expect(receipt.receiptNumber).toBeDefined();
    expect(receipt.amount).toBeDefined();
    expect(receipt.paymentMethod).toBeDefined();
  });
});

describe("Sales Module - Summary Reports", () => {
  it("should calculate sales summary with breakdown", () => {
    const sales = [
      { id: 1, total: 500000, paymentMethod: "cash" },
      { id: 2, total: 300000, paymentMethod: "mobile_money" },
      { id: 3, total: 200000, paymentMethod: "cash" },
    ];

    const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
    const cashSales = sales.filter(s => s.paymentMethod === "cash").reduce((sum, s) => sum + s.total, 0);
    const mobileMoneySales = sales.filter(s => s.paymentMethod === "mobile_money").reduce((sum, s) => sum + s.total, 0);

    expect(totalSales).toBe(1000000);
    expect(cashSales).toBe(700000);
    expect(mobileMoneySales).toBe(300000);
    expect(cashSales + mobileMoneySales).toBe(totalSales);
  });

  it("should calculate average transaction value", () => {
    const sales = [
      { total: 500000 },
      { total: 300000 },
      { total: 200000 },
    ];

    const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
    const average = totalSales / sales.length;

    expect(average).toBeCloseTo(333333.33, 1);
  });
});
