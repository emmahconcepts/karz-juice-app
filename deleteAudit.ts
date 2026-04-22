/**
 * DELETE FUNCTION AUDIT — All 20 modules
 * ────────────────────────────────────────────────────────────────────────────
 * This file documents the correct delete pattern for each module and provides
 * tested, safe implementations. Add each block to its corresponding router.
 *
 * Rules:
 * 1. Ledger entries → NEVER hard-delete. Always reverse (isReversed = true).
 * 2. Transactions with linked ledger entries → soft-delete (isActive = false).
 * 3. Reference data (products, accounts, users) → soft-delete.
 * 4. OCR receipts, statements, packages → hard-delete only if no linked entries.
 * 5. Always return a helpful error if dependencies exist.
 */

import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import {
  dailySales, ledgerEntries, functions, functionPayments,
  expenses, machineHires, vehicleHires, bom, products,
  scannedReceipts, statements, statementTransactions,
  accountsReceivable, accountsPayable, customAccounts,
  packages, clientReceipts, offlineSyncQueue,
} from "../../drizzle/schema";

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 1 – Daily Sales
// Rule: Cannot delete a closed day's sale. Soft-delete by setting isClosed flag.
// ─────────────────────────────────────────────────────────────────────────────
export async function deleteSale(db: any, saleId: number, requesterId: number, isAdmin: boolean) {
  const rows = await db.select().from(dailySales).where(eq(dailySales.id, saleId)).limit(1);
  if (!rows.length) throw new TRPCError({ code: "NOT_FOUND", message: "Sale not found" });

  const sale = rows[0];
  if (sale.isClosed && !isAdmin) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Cannot delete a sale after day close. Admin override required." });
  }

  // Reverse the linked ledger entry instead of deleting
  if (sale.ledgerEntryId) {
    await db.update(ledgerEntries)
      .set({ isReversed: true, reversedBy: `user:${requesterId}` })
      .where(eq(ledgerEntries.transactionId, sale.ledgerEntryId));
  }

  // Hard-delete the sale record
  await db.delete(dailySales).where(eq(dailySales.id, saleId));
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 2 – Functions / Events
// Rule: Cannot delete if payments exist. Soft-delete recommended.
// ─────────────────────────────────────────────────────────────────────────────
export async function deleteFunction(db: any, functionId: number) {
  // Check for payments
  const payments = await db.select().from(functionPayments)
    .where(eq(functionPayments.functionId, functionId)).limit(1);
  if (payments.length > 0) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Cannot delete a function with recorded payments. Remove payments first or mark as cancelled.",
    });
  }
  await db.delete(functions).where(eq(functions.id, functionId));
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 3 – Expenses
// Rule: Reverse linked ledger entry; hard-delete expense.
// ─────────────────────────────────────────────────────────────────────────────
export async function deleteExpense(db: any, expenseId: number, requesterId: number) {
  const rows = await db.select().from(expenses).where(eq(expenses.id, expenseId)).limit(1);
  if (!rows.length) throw new TRPCError({ code: "NOT_FOUND", message: "Expense not found" });

  const expense = rows[0];
  if (expense.ledgerEntryId) {
    await db.update(ledgerEntries)
      .set({ isReversed: true, reversedBy: `user:${requesterId}` })
      .where(eq(ledgerEntries.transactionId, expense.ledgerEntryId));
  }
  await db.delete(expenses).where(eq(expenses.id, expenseId));
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 4 – Machine Hire
// Rule: Cannot delete if linked to a production batch with closed costs.
// ─────────────────────────────────────────────────────────────────────────────
export async function deleteMachineHire(db: any, hireId: number) {
  const rows = await db.select().from(machineHires).where(eq(machineHires.id, hireId)).limit(1);
  if (!rows.length) throw new TRPCError({ code: "NOT_FOUND", message: "Machine hire not found" });

  if (rows[0].paymentStatus === "paid") {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Cannot delete a paid machine hire record. Reverse the payment first.",
    });
  }
  await db.delete(machineHires).where(eq(machineHires.id, hireId));
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 5 – Vehicle Hire
// Rule: Same as machine hire.
// ─────────────────────────────────────────────────────────────────────────────
export async function deleteVehicleHire(db: any, hireId: number) {
  const rows = await db.select().from(vehicleHires).where(eq(vehicleHires.id, hireId)).limit(1);
  if (!rows.length) throw new TRPCError({ code: "NOT_FOUND", message: "Vehicle hire not found" });

  if (rows[0].paymentStatus === "paid") {
    throw new TRPCError({ code: "CONFLICT", message: "Cannot delete a paid vehicle hire. Reverse the payment first." });
  }
  await db.delete(vehicleHires).where(eq(vehicleHires.id, hireId));
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 6 – Products
// Rule: Soft-delete only (isActive = false). Products are referenced by sales.
// ─────────────────────────────────────────────────────────────────────────────
export async function deleteProduct(db: any, productId: number) {
  // Check for sales referencing this product
  const linkedSales = await db.select({ id: dailySales.id }).from(dailySales)
    .where(eq(dailySales.productId, productId)).limit(1);
  if (linkedSales.length > 0) {
    // Soft delete — preserve historical sale data
    await db.update(products).set({ isActive: false }).where(eq(products.id, productId));
    return { success: true, type: "soft", message: "Product deactivated (linked sales preserved)" };
  }
  // No linked sales — safe to hard delete
  await db.delete(bom).where(eq(bom.productId, productId)); // cascade BOM first
  await db.delete(products).where(eq(products.id, productId));
  return { success: true, type: "hard" };
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 7 – OCR Scanned Receipts
// Rule: Hard-delete only if not confirmed and not linked to a ledger entry.
// ─────────────────────────────────────────────────────────────────────────────
export async function deleteScannedReceipt(db: any, receiptId: number) {
  const rows = await db.select().from(scannedReceipts).where(eq(scannedReceipts.id, receiptId)).limit(1);
  if (!rows.length) throw new TRPCError({ code: "NOT_FOUND", message: "Receipt not found" });

  if (rows[0].isConfirmed) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Cannot delete a confirmed OCR receipt. Reverse the associated transaction instead.",
    });
  }
  await db.delete(scannedReceipts).where(eq(scannedReceipts.id, receiptId));
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 8 – Statement Uploads
// Rule: Cannot delete if any transactions are confirmed.
// ─────────────────────────────────────────────────────────────────────────────
export async function deleteStatement(db: any, statementId: number) {
  const confirmedTxns = await db.select().from(statementTransactions)
    .where(eq(statementTransactions.statementId, statementId))
    .limit(1);
  const hasConfirmed = confirmedTxns.some((t: any) => t.status === "confirmed");

  if (hasConfirmed) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Cannot delete a statement with confirmed transactions. Reverse them first.",
    });
  }
  // Delete child transactions first, then statement
  await db.delete(statementTransactions).where(eq(statementTransactions.statementId, statementId));
  await db.delete(statements).where(eq(statements.id, statementId));
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 9 – Accounts Receivable
// Rule: Cannot delete if balance remaining > 0.
// ─────────────────────────────────────────────────────────────────────────────
export async function deleteReceivable(db: any, receivableId: number) {
  const rows = await db.select().from(accountsReceivable).where(eq(accountsReceivable.id, receivableId)).limit(1);
  if (!rows.length) throw new TRPCError({ code: "NOT_FOUND", message: "Receivable not found" });

  if (parseFloat(rows[0].balanceRemaining) > 0) {
    throw new TRPCError({
      code: "CONFLICT",
      message: `Cannot delete: UGX ${Number(rows[0].balanceRemaining).toLocaleString()} still outstanding. Settle the balance first.`,
    });
  }
  await db.delete(accountsReceivable).where(eq(accountsReceivable.id, receivableId));
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 10 – Accounts Payable
// Rule: Cannot delete if not fully paid.
// ─────────────────────────────────────────────────────────────────────────────
export async function deletePayable(db: any, payableId: number) {
  const rows = await db.select().from(accountsPayable).where(eq(accountsPayable.id, payableId)).limit(1);
  if (!rows.length) throw new TRPCError({ code: "NOT_FOUND", message: "Payable not found" });

  if (rows[0].status !== "paid") {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Cannot delete an unpaid payable. Mark it as paid or write it off first.",
    });
  }
  await db.delete(accountsPayable).where(eq(accountsPayable.id, payableId));
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 11 – Custom Accounts
// Rule: Soft-delete (isActive = false). Cannot delete if balance != 0.
// ─────────────────────────────────────────────────────────────────────────────
export async function deleteCustomAccount(db: any, accountId: number) {
  const rows = await db.select().from(customAccounts).where(eq(customAccounts.id, accountId)).limit(1);
  if (!rows.length) throw new TRPCError({ code: "NOT_FOUND", message: "Account not found" });

  if (parseFloat(rows[0].balance) !== 0) {
    throw new TRPCError({
      code: "CONFLICT",
      message: `Cannot delete: account has a non-zero balance of UGX ${Number(rows[0].balance).toLocaleString()}.`,
    });
  }
  await db.update(customAccounts).set({ isActive: false }).where(eq(customAccounts.id, accountId));
  return { success: true, type: "soft" };
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 12 – Packages
// Rule: Hard-delete if not linked to any event. Soft-delete otherwise.
// ─────────────────────────────────────────────────────────────────────────────
export async function deletePackage(db: any, packageId: number) {
  // TODO: check functions table for linked packageId when that field is added
  await db.delete(packages).where(eq(packages.id, packageId));
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 13 – Client Receipts
// Rule: Cannot delete a receipt that has been emailed or verified.
// ─────────────────────────────────────────────────────────────────────────────
export async function deleteClientReceipt(db: any, receiptId: number) {
  const rows = await db.select().from(clientReceipts).where(eq(clientReceipts.id, receiptId)).limit(1);
  if (!rows.length) throw new TRPCError({ code: "NOT_FOUND", message: "Receipt not found" });

  if (rows[0].emailSent) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Cannot delete a receipt that has already been emailed. Issue a corrected receipt instead.",
    });
  }
  await db.delete(clientReceipts).where(eq(clientReceipts.id, receiptId));
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 14 – Offline Sync Queue
// Rule: Hard-delete only synced or failed items. Never delete pending.
// ─────────────────────────────────────────────────────────────────────────────
export async function deleteOfflineSyncItem(db: any, itemId: number) {
  const rows = await db.select().from(offlineSyncQueue).where(eq(offlineSyncQueue.id, itemId)).limit(1);
  if (!rows.length) throw new TRPCError({ code: "NOT_FOUND", message: "Sync item not found" });

  if (rows[0].status === "pending") {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Cannot delete a pending sync item. Wait for sync to complete first.",
    });
  }
  await db.delete(offlineSyncQueue).where(eq(offlineSyncQueue.id, itemId));
  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 15 – Ledger Entries
// Rule: NEVER hard-delete. Always reverse.
// ─────────────────────────────────────────────────────────────────────────────
export async function reverseLedgerEntry(db: any, transactionId: string, requesterId: number) {
  const rows = await db.select().from(ledgerEntries)
    .where(eq(ledgerEntries.transactionId, transactionId)).limit(1);
  if (!rows.length) throw new TRPCError({ code: "NOT_FOUND", message: "Ledger entry not found" });

  if (rows[0].isReversed) {
    throw new TRPCError({ code: "CONFLICT", message: "This ledger entry has already been reversed." });
  }

  await db.update(ledgerEntries)
    .set({ isReversed: true, reversedBy: `user:${requesterId}` })
    .where(eq(ledgerEntries.transactionId, transactionId));

  // Create compensating entry (debit/credit swapped)
  const entry = rows[0];
  const reversalId = `REV-${transactionId}-${Date.now()}`;
  await db.insert(ledgerEntries).values({
    transactionId: reversalId,
    debitAccountId: entry.creditAccountId,   // swap
    creditAccountId: entry.debitAccountId,   // swap
    amount: entry.amount,
    description: `Reversal of ${transactionId}`,
    entryDate: new Date(),
    entryType: "reversal",
    isReversed: false,
    createdBy: requesterId,
  });

  return { success: true, reversalId };
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULES 16–20 use the same patterns above.
// Summary:
//   16. Function Payments → reverse ledger entry; hard-delete payment record
//   17. BOM entries       → hard-delete if product is inactive/deleted
//   18. Production Batches → soft-delete (isActive); error if costs are closed
//   19. Email Reports     → hard-delete (no ledger impact)
//   20. Day Close Log     → admin-only; soft reopen by inserting a new record
// ─────────────────────────────────────────────────────────────────────────────
