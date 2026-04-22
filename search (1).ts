import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { TRPCError } from "@trpc/server";
import { like, or } from "drizzle-orm";
import {
  clientReceipts,
  products,
  accountsReceivable,
  customAccounts,
  accounts,
  packages,
} from "../../drizzle/schema";

// Helper: safely get functions table (may be in separate module)
async function searchFunctions(db: any, q: string) {
  try {
    const { functions } = await import("../../drizzle/schema");
    return db.select({
      id: functions.id,
      clientName: functions.clientName,
      eventType: functions.eventType,
      status: functions.status,
    }).from(functions).where(like(functions.clientName, `%${q}%`)).limit(5);
  } catch { return []; }
}

export const searchRouter = router({
  globalSearch: protectedProcedure
    .input(z.object({ query: z.string().min(2).max(100) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const q = `%${input.query}%`;

      const [
        receiptResults,
        productResults,
        receivableResults,
        customAccountResults,
        accountResults,
        packageResults,
        functionResults,
      ] = await Promise.all([
        // Receipts
        db.select({
          id: clientReceipts.id,
          receiptNumber: clientReceipts.receiptNumber,
          clientName: clientReceipts.clientName,
          eventReference: clientReceipts.eventReference,
        }).from(clientReceipts)
          .where(or(like(clientReceipts.clientName, q), like(clientReceipts.receiptNumber, q)))
          .limit(5),

        // Products
        db.select({ id: products.id, name: products.name, sku: products.sku })
          .from(products)
          .where(or(like(products.name, q), like(products.sku, q)))
          .limit(5),

        // Clients (via receivables)
        db.select({ id: accountsReceivable.id, clientName: accountsReceivable.clientName, status: accountsReceivable.status })
          .from(accountsReceivable)
          .where(like(accountsReceivable.clientName, q))
          .limit(5),

        // Custom accounts
        db.select({ id: customAccounts.id, accountName: customAccounts.accountName, accountCode: customAccounts.accountCode })
          .from(customAccounts)
          .where(or(like(customAccounts.accountName, q), like(customAccounts.accountCode, q)))
          .limit(5),

        // Core accounts
        db.select({ id: accounts.id, name: accounts.name, code: accounts.code })
          .from(accounts)
          .where(or(like(accounts.name, q), like(accounts.code, q)))
          .limit(5),

        // Packages
        db.select({ id: packages.id, packageName: packages.packageName, description: packages.description })
          .from(packages)
          .where(like(packages.packageName, q))
          .limit(5),

        // Functions (events)
        searchFunctions(db, input.query),
      ]);

      return {
        receipts: receiptResults,
        products: productResults,
        clients: receivableResults.map((r: any) => ({ id: r.id, clientName: r.clientName })),
        accounts: [...customAccountResults, ...accountResults].slice(0, 5),
        packages: packageResults,
        functions: functionResults,
        transactions: [], // Ledger search can be expensive — add separately if needed
      };
    }),
});
