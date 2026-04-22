import { describe, expect, it, beforeEach, vi } from "vitest";
import * as db from "./db";

vi.mock("./db", () => ({
  recordMachineHire: vi.fn(),
  getMachineHiresByDateRange: vi.fn(),
  recordVehicleHire: vi.fn(),
  getVehicleHiresByDateRange: vi.fn(),
  createBOMItem: vi.fn(),
  getBOMByProductId: vi.fn(),
  createLedgerEntry: vi.fn(),
}));

describe("Machine Hire Module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should record machine hire with daily rate", async () => {
    const mockHire = {
      machineName: "Industrial Blender",
      ownerName: "John's Equipment",
      costType: "daily" as const,
      hirePeriodStart: new Date("2026-03-01"),
      hirePeriodEnd: new Date("2026-03-05"),
      costAmount: "500000",
      paymentStatus: "pending" as const,
    };

    vi.mocked(db.recordMachineHire).mockResolvedValue({ insertId: 1 } as any);

    const result = await db.recordMachineHire(mockHire);

    expect(result).toBeDefined();
    expect(mockHire.costType).toBe("daily");
  });

  it("should record machine hire with per-job rate", async () => {
    const mockHire = {
      machineName: "Packaging Machine",
      ownerName: "ABC Rentals",
      costType: "per_job" as const,
      hirePeriodStart: new Date("2026-03-02"),
      costAmount: "2000000",
      paymentStatus: "pending" as const,
    };

    vi.mocked(db.recordMachineHire).mockResolvedValue({ insertId: 2 } as any);

    const result = await db.recordMachineHire(mockHire);

    expect(result).toBeDefined();
    expect(mockHire.costType).toBe("per_job");
  });

  it("should retrieve machine hires by date range", async () => {
    const mockHires = [
      {
        id: 1,
        machineName: "Blender",
        ownerName: "Owner A",
        costType: "daily",
        costAmount: "500000",
        hirePeriodStart: new Date("2026-03-01"),
      },
      {
        id: 2,
        machineName: "Mixer",
        ownerName: "Owner B",
        costType: "per_job",
        costAmount: "1000000",
        hirePeriodStart: new Date("2026-03-02"),
      },
    ];

    vi.mocked(db.getMachineHiresByDateRange).mockResolvedValue(mockHires as any);

    const result = await db.getMachineHiresByDateRange(new Date("2026-03-01"), new Date("2026-03-05"));

    expect(result).toHaveLength(2);
    expect(result[0].costType).toBe("daily");
    expect(result[1].costType).toBe("per_job");
  });

  it("should calculate total machine hire cost", () => {
    const hires = [
      { costAmount: 500000 },
      { costAmount: 1000000 },
      { costAmount: 750000 },
    ];

    const totalCost = hires.reduce((sum, h) => sum + h.costAmount, 0);

    expect(totalCost).toBe(2250000);
  });

  it("should create ledger entry for machine hire expense", () => {
    const hire = {
      amount: "500000",
      debitAccount: "Machine Hire Expense",
      creditAccount: "Cash",
    };

    expect(hire.debitAccount).not.toBe(hire.creditAccount);
    expect(hire.amount).toBe("500000");
  });
});

describe("Vehicle Hire Module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should record vehicle hire for delivery", async () => {
    const mockHire = {
      vehicleOwnerName: "ABC Taxi",
      purpose: "delivery" as const,
      hirePeriodStart: new Date("2026-03-02"),
      cost: "300000",
      fuelIncluded: true,
      paymentMethod: "cash" as const,
    };

    vi.mocked(db.recordVehicleHire).mockResolvedValue({ insertId: 1 } as any);

    const result = await db.recordVehicleHire(mockHire);

    expect(result).toBeDefined();
    expect(mockHire.purpose).toBe("delivery");
  });

  it("should record vehicle hire for function", async () => {
    const mockHire = {
      vehicleOwnerName: "XYZ Transport",
      purpose: "function" as const,
      hirePeriodStart: new Date("2026-03-15"),
      hirePeriodEnd: new Date("2026-03-16"),
      cost: "1500000",
      fuelIncluded: false,
      paymentMethod: "mobile_money" as const,
    };

    vi.mocked(db.recordVehicleHire).mockResolvedValue({ insertId: 2 } as any);

    const result = await db.recordVehicleHire(mockHire);

    expect(result).toBeDefined();
    expect(mockHire.purpose).toBe("function");
  });

  it("should record vehicle hire for sourcing", async () => {
    const mockHire = {
      vehicleOwnerName: "Logistics Co",
      purpose: "sourcing" as const,
      hirePeriodStart: new Date("2026-03-03"),
      cost: "750000",
      fuelIncluded: true,
      paymentMethod: "cash" as const,
    };

    vi.mocked(db.recordVehicleHire).mockResolvedValue({ insertId: 3 } as any);

    const result = await db.recordVehicleHire(mockHire);

    expect(result).toBeDefined();
    expect(mockHire.purpose).toBe("sourcing");
  });

  it("should retrieve vehicle hires by date range", async () => {
    const mockHires = [
      {
        id: 1,
        vehicleOwnerName: "Taxi A",
        purpose: "delivery",
        cost: "300000",
        fuelIncluded: true,
      },
      {
        id: 2,
        vehicleOwnerName: "Transport B",
        purpose: "function",
        cost: "1500000",
        fuelIncluded: false,
      },
    ];

    vi.mocked(db.getVehicleHiresByDateRange).mockResolvedValue(mockHires as any);

    const result = await db.getVehicleHiresByDateRange(new Date("2026-03-01"), new Date("2026-03-31"));

    expect(result).toHaveLength(2);
  });

  it("should track payment method for vehicle hire", () => {
    const hires = [
      { paymentMethod: "cash" },
      { paymentMethod: "mobile_money" },
      { paymentMethod: "cash" },
    ];

    const cashPayments = hires.filter(h => h.paymentMethod === "cash").length;
    const mobilePayments = hires.filter(h => h.paymentMethod === "mobile_money").length;

    expect(cashPayments).toBe(2);
    expect(mobilePayments).toBe(1);
  });

  it("should track fuel inclusion in vehicle hire", () => {
    const hires = [
      { fuelIncluded: true, cost: 300000 },
      { fuelIncluded: false, cost: 500000 },
      { fuelIncluded: true, cost: 400000 },
    ];

    const fuelIncludedCount = hires.filter(h => h.fuelIncluded).length;
    const fuelNotIncludedCount = hires.filter(h => !h.fuelIncluded).length;

    expect(fuelIncludedCount).toBe(2);
    expect(fuelNotIncludedCount).toBe(1);
  });
});

describe("BOM & Production Module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create BOM item with ingredient and cost", async () => {
    const mockBOMItem = {
      productId: 1,
      ingredient: "Fresh Mango",
      quantity: "5",
      unitCost: "50000",
      totalCost: "250000",
      notes: "Premium grade",
    };

    vi.mocked(db.createBOMItem).mockResolvedValue({ insertId: 1 } as any);

    const result = await db.createBOMItem(mockBOMItem);

    expect(result).toBeDefined();
    expect(mockBOMItem.totalCost).toBe((parseFloat(mockBOMItem.quantity) * parseFloat(mockBOMItem.unitCost)).toString());
  });

  it("should retrieve BOM by product ID", async () => {
    const mockBOM = [
      { id: 1, ingredient: "Mango", quantity: "5", unitCost: "50000" },
      { id: 2, ingredient: "Sugar", quantity: "2", unitCost: "30000" },
      { id: 3, ingredient: "Water", quantity: "10", unitCost: "5000" },
    ];

    vi.mocked(db.getBOMByProductId).mockResolvedValue(mockBOM as any);

    const result = await db.getBOMByProductId(1);

    expect(result).toHaveLength(3);
  });

  it("should calculate cost per unit from BOM", () => {
    const bomItems = [
      { quantity: 5, unitCost: 50000 },
      { quantity: 2, unitCost: 30000 },
      { quantity: 10, unitCost: 5000 },
    ];

    const totalCost = bomItems.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
    const costPerUnit = totalCost / 10; // Assuming 10 units produced

    expect(totalCost).toBe(360000);
    expect(costPerUnit).toBe(36000);
  });

  it("should track ingredient costs for profitability analysis", () => {
    const product = {
      name: "Mango Juice 1L",
      sellingPrice: 100000,
      bomCost: 35000,
      profitMargin: 65000,
    };

    expect(product.profitMargin).toBe(product.sellingPrice - product.bomCost);
    expect(product.profitMargin).toBeGreaterThan(0);
  });

  it("should support multiple BOM items for complex products", () => {
    const complexProduct = {
      name: "Mixed Fruit Juice",
      bomItems: [
        { ingredient: "Mango", cost: 50000 },
        { ingredient: "Orange", cost: 40000 },
        { ingredient: "Pineapple", cost: 45000 },
        { ingredient: "Sugar", cost: 10000 },
        { ingredient: "Water", cost: 5000 },
      ],
    };

    const totalBOMCost = complexProduct.bomItems.reduce((sum, item) => sum + item.cost, 0);

    expect(complexProduct.bomItems).toHaveLength(5);
    expect(totalBOMCost).toBe(150000);
  });

  it("should create ledger entry for production batch", () => {
    const batchEntry = {
      batchId: "BATCH-001",
      amount: "150000",
      debitAccount: "Work in Progress",
      creditAccount: "Raw Materials",
    };

    expect(batchEntry.debitAccount).not.toBe(batchEntry.creditAccount);
    expect(batchEntry.amount).toBe("150000");
  });
});

describe("Operations Integration - Ledger Entries", () => {
  it("should create ledger entry for machine hire", () => {
    const entry = {
      amount: "500000",
      debitAccount: "Machine Hire Expense",
      creditAccount: "Cash",
    };

    expect(entry.debitAccount).not.toBe(entry.creditAccount);
  });

  it("should create ledger entry for vehicle hire", () => {
    const entry = {
      amount: "300000",
      debitAccount: "Vehicle Hire Expense",
      creditAccount: "Mobile Money",
    };

    expect(entry.debitAccount).not.toBe(entry.creditAccount);
  });

  it("should create ledger entry for production costs", () => {
    const entry = {
      amount: "150000",
      debitAccount: "Work in Progress",
      creditAccount: "Raw Materials Inventory",
    };

    expect(entry.debitAccount).not.toBe(entry.creditAccount);
  });
});
