import { eq, and, gte, lte, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users,
  accounts,
  ledgerEntries,
  dailySales,
  functions,
  functionPayments,
  expenses,
  machineHires,
  vehicleHires,
  receipts,
  statements,
  statementTransactions,
  products,
  bom,
  productionBatches,
  offlineSyncQueue,
  dayCloseLog,
  organization,
  qrCodeLinks,
  clientReceipts
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ===== ACCOUNTS & LEDGER =====

export async function getAccountByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(accounts).where(eq(accounts.code, code)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllAccounts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(accounts).where(eq(accounts.isActive, true));
}

export async function createLedgerEntry(entry: typeof ledgerEntries.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(ledgerEntries).values(entry);
  return result;
}

export async function getLedgerEntriesByDate(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(ledgerEntries)
    .where(and(
      gte(ledgerEntries.entryDate, startDate),
      lte(ledgerEntries.entryDate, endDate)
    ))
    .orderBy(desc(ledgerEntries.entryDate));
}

// ===== DAILY SALES =====

export async function createDailySale(sale: typeof dailySales.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(dailySales).values(sale);
  return result;
}

export async function getDailySalesByDate(saleDate: Date) {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(dailySales)
    .where(eq(dailySales.saleDate, saleDate))
    .orderBy(desc(dailySales.createdAt));
}

export async function getDailySalesTotalByDate(saleDate: Date) {
  const db = await getDb();
  if (!db) return "0";
  const result = await db.select({ total: dailySales.total })
    .from(dailySales)
    .where(eq(dailySales.saleDate, saleDate));
  return result.reduce((sum, row) => sum + parseFloat(row.total.toString()), 0).toString();
}

// ===== FUNCTIONS (EVENTS) =====

export async function createFunction(func: typeof functions.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(functions).values(func);
  return result;
}

export async function getFunctionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(functions).where(eq(functions.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllFunctions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(functions).orderBy(desc(functions.createdAt));
}

export async function getOverdueFunctions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(functions).where(eq(functions.status, "overdue"));
}

// ===== FUNCTION PAYMENTS =====

export async function createFunctionPayment(payment: typeof functionPayments.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(functionPayments).values(payment);
}

export async function getFunctionPaymentsByFunctionId(functionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(functionPayments).where(eq(functionPayments.functionId, functionId));
}

// ===== EXPENSES =====

export async function createExpense(expense: typeof expenses.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(expenses).values(expense);
}

export async function getExpensesByDateRange(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(expenses)
    .where(and(
      gte(expenses.expenseDate, startDate),
      lte(expenses.expenseDate, endDate)
    ))
    .orderBy(desc(expenses.expenseDate));
}

export async function getExpensesByCategory(category: any) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(expenses).where(eq(expenses.category, category as any));
}

// ===== MACHINE HIRE =====

export async function createMachineHire(hire: typeof machineHires.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(machineHires).values(hire);
}

export async function getMachineHiresByDateRange(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(machineHires)
    .where(and(
      gte(machineHires.hirePeriodStart, startDate),
      lte(machineHires.hirePeriodStart, endDate)
    ))
    .orderBy(desc(machineHires.createdAt));
}

// ===== VEHICLE HIRE =====

export async function createVehicleHire(hire: typeof vehicleHires.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(vehicleHires).values(hire);
}

export async function getVehicleHiresByDateRange(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(vehicleHires)
    .where(and(
      gte(vehicleHires.hirePeriodStart, startDate),
      lte(vehicleHires.hirePeriodStart, endDate)
    ))
    .orderBy(desc(vehicleHires.createdAt));
}

// ===== RECEIPTS & OCR =====

export async function createReceipt(receipt: typeof receipts.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(receipts).values(receipt);
}

export async function getUnconfirmedReceipts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(receipts).where(eq(receipts.isConfirmed, false));
}

export async function confirmReceipt(receiptId: number, confirmedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(receipts)
    .set({ isConfirmed: true, confirmedBy, updatedAt: new Date() })
    .where(eq(receipts.id, receiptId));
}

// ===== STATEMENTS =====

export async function createStatement(statement: typeof statements.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(statements).values(statement);
}

export async function getStatementById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(statements).where(eq(statements.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ===== STATEMENT TRANSACTIONS =====

export async function createStatementTransaction(transaction: typeof statementTransactions.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(statementTransactions).values(transaction);
}

export async function getUnmatchedStatementTransactions(statementId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(statementTransactions)
    .where(and(
      eq(statementTransactions.statementId, statementId),
      eq(statementTransactions.status, "unmatched")
    ));
}

// ===== PRODUCTS & BOM =====

export async function createProduct(product: typeof products.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(products).values(product);
}

export async function getAllProducts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(eq(products.isActive, true));
}

export async function getBOMByProductId(productId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(bom).where(eq(bom.productId, productId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ===== PRODUCTION BATCHES =====

export async function createProductionBatch(batch: typeof productionBatches.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(productionBatches).values(batch);
}

export async function getProductionBatchesByDateRange(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(productionBatches)
    .where(and(
      gte(productionBatches.productionDate, startDate),
      lte(productionBatches.productionDate, endDate)
    ))
    .orderBy(desc(productionBatches.productionDate));
}

// ===== OFFLINE SYNC QUEUE =====

export async function addToSyncQueue(item: typeof offlineSyncQueue.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(offlineSyncQueue).values(item);
}

export async function getPendingSyncItems(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select()
    .from(offlineSyncQueue)
    .where(and(
      eq(offlineSyncQueue.userId, userId),
      eq(offlineSyncQueue.status, "pending")
    ));
}

export async function markSyncItemAsSynced(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(offlineSyncQueue)
    .set({ status: "synced", syncedAt: new Date() })
    .where(eq(offlineSyncQueue.id, id));
}

// ===== DAY CLOSE =====

export async function createDayCloseLog(log: typeof dayCloseLog.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(dayCloseLog).values(log);
}

export async function getDayCloseLogByDate(closeDate: Date) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(dayCloseLog).where(eq(dayCloseLog.closeDate, closeDate)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}


// ===== QR CODE LINKS (PUBLIC CUSTOMER PORTAL) =====

/**
 * Get receipt details by QR code token (public access)
 */
export async function getReceiptByQRToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;

  try {
    // Find QR code link
    const qrLink = await db
      .select()
      .from(qrCodeLinks)
      .where(eq(qrCodeLinks.token, token))
      .limit(1);

    if (qrLink.length === 0) {
      return undefined;
    }

    const link = qrLink[0];

    // Check if link is expired
    if (link.expiresAt && new Date() > link.expiresAt) {
      return undefined;
    }

    // Check if access limit reached
    if (link.maxAccess && link.accessCount >= link.maxAccess) {
      return undefined;
    }

    // Check if public
    if (!link.isPublic) {
      return undefined;
    }

    // Get receipt details
    const receipt = await db
      .select()
      .from(clientReceipts)
      .where(eq(clientReceipts.id, link.receiptId))
      .limit(1);

    if (receipt.length === 0) {
      return undefined;
    }

    // Update access count and last accessed time
    await db
      .update(qrCodeLinks)
      .set({
        accessCount: link.accessCount + 1,
        lastAccessedAt: new Date(),
      })
      .where(eq(qrCodeLinks.id, link.id));

    return receipt[0];
  } catch (error) {
    console.error("[Database] Failed to get receipt by QR token:", error);
    return undefined;
  }
}

/**
 * Create QR code link for a receipt
 */
export async function createQRCodeLink(data: typeof qrCodeLinks.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db.insert(qrCodeLinks).values(data);
    return result;
  } catch (error) {
    console.error("[Database] Failed to create QR code link:", error);
    throw error;
  }
}

/**
 * Get QR code link by token
 */
export async function getQRCodeLink(token: string) {
  const db = await getDb();
  if (!db) return undefined;

  try {
    const result = await db
      .select()
      .from(qrCodeLinks)
      .where(eq(qrCodeLinks.token, token))
      .limit(1);

    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to get QR code link:", error);
    return undefined;
  }
}

/**
 * Get client receipt by ID
 */
export async function getClientReceiptById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  try {
    const result = await db
      .select()
      .from(clientReceipts)
      .where(eq(clientReceipts.id, id))
      .limit(1);

    return result.length > 0 ? result[0] : undefined;
  } catch (error) {
    console.error("[Database] Failed to get client receipt:", error);
    return undefined;
  }
}
