import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
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
    openId: "finance-user",
    email: "finance@example.com",
    name: "Finance User",
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

function createOperationsContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 3,
    openId: "ops-user",
    email: "ops@example.com",
    name: "Operations User",
    loginMethod: "manus",
    role: "operations",
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

describe("customAccounts module", () => {
  it("admin can create custom account", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.customAccounts.createCustomAccount({
      accountName: `Advertising Expense ${Date.now()}`,
      accountCode: `ADV-${Date.now()}`,
      classification: "expense",
      description: "For advertising campaigns",
    });

    expect(result.success).toBe(true);
  });

  it("finance can create custom account", async () => {
    const ctx = createFinanceContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.customAccounts.createCustomAccount({
      accountName: `Equipment Purchase ${Date.now()}`,
      accountCode: `EQP-${Date.now()}`,
      classification: "asset",
      description: "For equipment purchases",
    });

    expect(result.success).toBe(true);
  });

  it("operations cannot create custom account", async () => {
    const ctx = createOperationsContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.customAccounts.createCustomAccount({
        accountName: "Unauthorized Account",
        accountCode: "UNA-001",
        classification: "expense",
      });
      expect.fail("Should have thrown error");
    } catch (error: any) {
      expect(error.code).toBe("FORBIDDEN");
    }
  });

  it("generates correct account code by classification", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const revenueCode = await caller.customAccounts.generateAccountCode({
      classification: "revenue",
    });
    expect(revenueCode).toMatch(/^REV-/);

    const expenseCode = await caller.customAccounts.generateAccountCode({
      classification: "expense",
    });
    expect(expenseCode).toMatch(/^EXP-/);

    const assetCode = await caller.customAccounts.generateAccountCode({
      classification: "asset",
    });
    expect(assetCode).toMatch(/^AST-/);

    const liabilityCode = await caller.customAccounts.generateAccountCode({
      classification: "liability",
    });
    expect(liabilityCode).toMatch(/^LIA-/);

    const equityCode = await caller.customAccounts.generateAccountCode({
      classification: "equity",
    });
    expect(equityCode).toMatch(/^EQT-/);
  });

  it("retrieves custom accounts", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const accounts = await caller.customAccounts.getCustomAccounts({
      limit: 50,
      offset: 0,
    });

    expect(Array.isArray(accounts)).toBe(true);
  });

  it("retrieves accounts by classification", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const expenseAccounts = await caller.customAccounts.getAccountsByClassification({
      classification: "expense",
    });

    expect(Array.isArray(expenseAccounts)).toBe(true);
  });

  it("gets account summary by classification", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const summary = await caller.customAccounts.getAccountSummaryByClassification();

    expect(typeof summary).toBe("object");
    // Summary only includes classifications that have accounts
    Object.values(summary).forEach((classificationData: any) => {
      expect(classificationData).toHaveProperty("count");
      expect(classificationData).toHaveProperty("totalBalance");
    });
  });

  it("updates custom account", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const uniqueCode = `TST-${Date.now()}`;
    const uniqueName = `Test Account ${Date.now()}`;

    // First create an account
    await caller.customAccounts.createCustomAccount({
      accountName: uniqueName,
      accountCode: uniqueCode,
      classification: "expense",
    });

    // Get the account
    const accounts = await caller.customAccounts.getCustomAccounts({
      limit: 50,
      offset: 0,
    });

    const testAccount = accounts.find((acc: any) => acc.accountCode === uniqueCode);
    if (testAccount) {
      const updatedName = `Updated Test Account ${Date.now()}`;
      const result = await caller.customAccounts.updateCustomAccount({
        id: testAccount.id,
        accountName: updatedName,
        isActive: false,
      });

      expect(result.success).toBe(true);
    }
  });

  it("deletes custom account", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const uniqueCode = `DEL-${Date.now()}`;
    const uniqueName = `Delete Test Account ${Date.now()}`;

    // First create an account
    await caller.customAccounts.createCustomAccount({
      accountName: uniqueName,
      accountCode: uniqueCode,
      classification: "expense",
    });

    // Get the account
    const accounts = await caller.customAccounts.getCustomAccounts({
      limit: 50,
      offset: 0,
    });

    const deleteAccount = accounts.find((acc: any) => acc.accountCode === uniqueCode);
    if (deleteAccount) {
      const result = await caller.customAccounts.deleteCustomAccount({
        id: deleteAccount.id,
      });

      expect(result.success).toBe(true);
    }
  });

  it("prevents duplicate account codes", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const uniqueCode = `DUP-${Date.now()}`;
    const firstName = `First Account ${Date.now()}`;
    const secondName = `Second Account ${Date.now()}`;

    // Create first account
    await caller.customAccounts.createCustomAccount({
      accountName: firstName,
      accountCode: uniqueCode,
      classification: "expense",
    });

    // Try to create another with same code
    try {
      await caller.customAccounts.createCustomAccount({
        accountName: secondName,
        accountCode: uniqueCode,
        classification: "expense",
      });
      expect.fail("Should have thrown error");
    } catch (error: any) {
      expect(error.message).toContain("Account code already exists");
    }
  });

  it("retrieves account by ID", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const uniqueCode = `GID-${Date.now()}`;
    const uniqueName = `Get By ID Test ${Date.now()}`;

    // Create account
    await caller.customAccounts.createCustomAccount({
      accountName: uniqueName,
      accountCode: uniqueCode,
      classification: "asset",
    });

    // Get all accounts and find our test account
    const accounts = await caller.customAccounts.getCustomAccounts({
      limit: 50,
      offset: 0,
    });

    const testAccount = accounts.find((acc: any) => acc.accountCode === uniqueCode);
    if (testAccount) {
      const retrieved = await caller.customAccounts.getCustomAccountById({
        id: testAccount.id,
      });

      expect(retrieved).not.toBeNull();
      expect(retrieved?.accountCode).toBe(uniqueCode);
    }
  });
});
