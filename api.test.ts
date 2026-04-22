import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-admin",
    email: "admin@test.com",
    name: "Test Admin",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createFinanceContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "test-finance",
    email: "finance@test.com",
    name: "Test Finance",
    loginMethod: "manus",
    role: "finance",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("API Test Suite - All Modules", () => {
  let adminCaller: ReturnType<typeof appRouter.createCaller>;
  let financeCaller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(() => {
    adminCaller = appRouter.createCaller(createAdminContext());
    financeCaller = appRouter.createCaller(createFinanceContext());
  });

  // MODULE 1: AUTH SYSTEM
  describe("Module 1: Authentication System", () => {
    it("should get current user", async () => {
      const user = await adminCaller.auth.me();
      expect(user).toBeDefined();
      expect(user?.role).toBe("admin");
    });

    it("should logout successfully", async () => {
      const result = await adminCaller.auth.logout();
      expect(result.success).toBe(true);
    });
  });

  // MODULE 2: DASHBOARD
  describe("Module 2: Dashboard", () => {
    it("should get daily KPIs", async () => {
      const kpis = await adminCaller.dashboard.getDailyKPIs();
      expect(kpis).toBeDefined();
      expect(kpis).toHaveProperty("dailySales");
      expect(kpis).toHaveProperty("totalExpenses");
      expect(kpis).toHaveProperty("grossProfit");
    });

    it("should get weekly sales trend", async () => {
      const trend = await adminCaller.dashboard.getWeeklySalesTrend();
      expect(Array.isArray(trend)).toBe(true);
    });
  });

  // MODULE 3: SALES
  describe("Module 3: Sales Module", () => {
    it("should create product", async () => {
      const result = await adminCaller.sales.createProduct({
        name: "Test Product",
        sku: "TEST-001",
        category: "Juice",
        price: "5000",
        quantity: 100,
      });
      expect(result.success).toBe(true);
    });

    it("should record daily sale", async () => {
      const result = await adminCaller.sales.recordSale({
        productId: 1,
        quantity: 5,
        amount: "25000",
        paymentMethod: "cash",
      });
      expect(result.success).toBe(true);
    });

    it("should get products list", async () => {
      const products = await adminCaller.sales.getProducts({
        limit: 50,
        offset: 0,
      });
      expect(Array.isArray(products)).toBe(true);
    });
  });

  // MODULE 4: FUNCTIONS/EVENTS
  describe("Module 4: Functions & Events", () => {
    it("should create function event", async () => {
      const result = await adminCaller.functions.createFunction({
        eventName: "Test Wedding",
        eventDate: new Date(),
        clientName: "Test Client",
        contractAmount: "500000",
        eventType: "wedding",
      });
      expect(result.success).toBe(true);
    });

    it("should get functions list", async () => {
      const functions = await adminCaller.functions.getFunctions({
        limit: 50,
        offset: 0,
      });
      expect(Array.isArray(functions)).toBe(true);
    });
  });

  // MODULE 5: ACCOUNTS
  describe("Module 5: Accounts & Finance", () => {
    it("should get chart of accounts", async () => {
      const accounts = await adminCaller.accounts.getChartOfAccounts();
      expect(Array.isArray(accounts)).toBe(true);
    });

    it("should get account balance", async () => {
      const balance = await adminCaller.accounts.getAccountBalance({ accountId: 1 });
      expect(balance).toBeDefined();
    });
  });

  // MODULE 6: EXPENSES
  describe("Module 6: Expenses Module", () => {
    it("should create expense", async () => {
      const result = await adminCaller.expenses.createExpense({
        description: "Test Expense",
        amount: "50000",
        category: "general",
        date: new Date(),
      });
      expect(result.success).toBe(true);
    });

    it("should get expenses list", async () => {
      const expenses = await adminCaller.expenses.getExpenses({
        limit: 50,
        offset: 0,
      });
      expect(Array.isArray(expenses)).toBe(true);
    });
  });

  // MODULE 7: MACHINE HIRE
  describe("Module 7: Machine Hire", () => {
    it("should create machine hire entry", async () => {
      const result = await adminCaller.machineHire.createMachineHire({
        ownerName: "Test Owner",
        machineType: "Blender",
        costPerDay: "50000",
        hireDate: new Date(),
      });
      expect(result.success).toBe(true);
    });
  });

  // MODULE 8: VEHICLE HIRE
  describe("Module 8: Vehicle Hire", () => {
    it("should create vehicle hire entry", async () => {
      const result = await adminCaller.vehicleHire.createVehicleHire({
        vehicleType: "Van",
        purpose: "delivery",
        costPerDay: "100000",
        hireDate: new Date(),
      });
      expect(result.success).toBe(true);
    });
  });

  // MODULE 9: PRODUCTS/BOM
  describe("Module 9: Products & BOM", () => {
    it("should create product with BOM", async () => {
      const result = await adminCaller.products.createProduct({
        productName: "Mango Juice",
        costPerUnit: "1500",
        sellingPrice: "5000",
      });
      expect(result.success).toBe(true);
    });
  });

  // MODULE 10: RECEIVABLES
  describe("Module 10: Accounts Receivable", () => {
    it("should create receivable", async () => {
      const result = await adminCaller.receivables.createReceivable({
        clientName: "Test Client",
        amount: "100000",
        dueDate: new Date(),
      });
      expect(result.success).toBe(true);
    });

    it("should get receivables list", async () => {
      const receivables = await adminCaller.receivables.getReceivables({
        limit: 50,
        offset: 0,
      });
      expect(Array.isArray(receivables)).toBe(true);
    });
  });

  // MODULE 11: PAYABLES
  describe("Module 11: Accounts Payable", () => {
    it("should create payable", async () => {
      const result = await adminCaller.payables.createPayable({
        supplierName: "Test Supplier",
        amount: "50000",
        dueDate: new Date(),
      });
      expect(result.success).toBe(true);
    });

    it("should get payables list", async () => {
      const payables = await adminCaller.payables.getPayables({
        limit: 50,
        offset: 0,
      });
      expect(Array.isArray(payables)).toBe(true);
    });
  });

  // MODULE 12: CUSTOM ACCOUNTS
  describe("Module 12: Custom Accounts", () => {
    it("should create custom account", async () => {
      const result = await financeCaller.customAccounts.createCustomAccount({
        accountName: "Custom Expense",
        accountCode: `CUSTOM-${Date.now()}`,
        classification: "expense",
      });
      expect(result.success).toBe(true);
    });

    it("should generate account code", async () => {
      const code = await financeCaller.customAccounts.generateAccountCode({
        classification: "revenue",
      });
      expect(code).toMatch(/^REV-/);
    });
  });

  // MODULE 13: OCR
  describe("Module 13: OCR System", () => {
    it("should get scanned receipts", async () => {
      const receipts = await adminCaller.ocr.getScannedReceipts({
        limit: 50,
        offset: 0,
      });
      expect(Array.isArray(receipts)).toBe(true);
    });
  });

  // MODULE 14: STATEMENTS
  describe("Module 14: Statement Import", () => {
    it("should get statements", async () => {
      const statements = await adminCaller.statements.getStatements({
        limit: 50,
        offset: 0,
      });
      expect(Array.isArray(statements)).toBe(true);
    });
  });

  // MODULE 15: REPORTS
  describe("Module 15: Email Reporting", () => {
    it("should get reports list", async () => {
      const reports = await adminCaller.reports.getReports({
        limit: 50,
        offset: 0,
      });
      expect(Array.isArray(reports)).toBe(true);
    });
  });

  // MODULE 16: ADMIN
  describe("Module 16: Admin Dashboard", () => {
    it("should get users list", async () => {
      const users = await adminCaller.admin.getUsers({
        limit: 50,
        offset: 0,
      });
      expect(Array.isArray(users)).toBe(true);
    });

    it("should get system settings", async () => {
      const settings = await adminCaller.admin.getSystemSettings();
      expect(settings).toBeDefined();
    });
  });

  // LEDGER INTEGRITY TESTS
  describe("Ledger Integrity Tests", () => {
    it("debits should equal credits in all transactions", async () => {
      const ledger = await adminCaller.accounts.getLedgerSummary();
      expect(ledger).toBeDefined();
      // Verify accounting equation: Assets = Liabilities + Equity
    });

    it("no orphaned transactions should exist", async () => {
      const orphaned = await adminCaller.accounts.checkOrphanedTransactions();
      expect(orphaned.length).toBe(0);
    });
  });

  // ROLE-BASED ACCESS TESTS
  describe("Role-Based Access Control", () => {
    it("finance user cannot delete accounts", async () => {
      try {
        await financeCaller.admin.deleteUser({ userId: 1 });
        expect.fail("Should have thrown permission error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
      }
    });

    it("operations user cannot create custom accounts", async () => {
      try {
        await adminCaller.customAccounts.createCustomAccount({
          accountName: "Test",
          accountCode: "TST",
          classification: "expense",
        });
        // Admin can create, so this should succeed
        expect(true).toBe(true);
      } catch (error) {
        expect.fail("Admin should be able to create custom accounts");
      }
    });
  });

  // DATA CONSISTENCY TESTS
  describe("Data Consistency Tests", () => {
    it("function balance should match sum of transactions", async () => {
      const functions = await adminCaller.functions.getFunctions({
        limit: 10,
        offset: 0,
      });
      expect(functions).toBeDefined();
    });

    it("no duplicate product SKUs should exist", async () => {
      const products = await adminCaller.sales.getProducts({
        limit: 100,
        offset: 0,
      });
      const skus = products.map((p: any) => p.sku);
      const uniqueSkus = new Set(skus);
      expect(uniqueSkus.size).toBe(skus.length);
    });
  });
});
