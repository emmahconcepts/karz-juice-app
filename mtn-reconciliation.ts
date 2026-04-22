/**
 * MTN Mobile Money Reconciliation Service — Complete DB Implementation
 */
import { getDb } from "../db";
import { eq, and, gte, lte, desc } from "drizzle-orm";

// MTN schema tables (from mtn-schema.ts)
let mtnTables: any = null;
async function getMtnTables() {
  if (mtnTables) return mtnTables;
  try { mtnTables = await import("../../drizzle/mtn-schema"); } catch { mtnTables = {}; }
  return mtnTables;
}
import { accountsReceivable } from "../../drizzle/schema";

export interface MtnTransactionData {
  mtnTransactionId: string; referenceId?: string; amount: number; currency: string;
  payerPhoneNumber: string; payerName?: string; payeePhoneNumber?: string;
  description?: string; transactionType: "payment"|"reversal"|"refund"|"transfer";
  status: "pending"|"completed"|"failed"|"reversed"; transactionDate: Date;
}
export interface ReconciliationResult { matched: number; unmatched: number; disputes: string[]; errors: string[]; }
export interface ReconciliationStatus { totalTransactions: number; matched: number; unmatched: number; disputed: number; lastSync: Date|null; }

export class MtnReconciliationService {
  async syncAndReconcile(startDate: Date, endDate: Date, autoReconcile = true): Promise<ReconciliationResult> {
    const result: ReconciliationResult = { matched: 0, unmatched: 0, disputes: [], errors: [] };
    const db = await getDb(); if (!db) { result.errors.push("DB unavailable"); return result; }
    const { mtnTransactions, mtnSyncHistory, mtnReconciliationRules } = await getMtnTables();
    if (!mtnTransactions) return result;
    try {
      const syncRes = await db.insert(mtnSyncHistory).values({ syncType:"incremental",status:"in_progress",syncStartDate:startDate,syncEndDate:endDate,transactionsFetched:0,transactionsMatched:0,transactionsCreated:0 });
      const syncId = (syncRes as any).insertId;
      const unmatched = await db.select().from(mtnTransactions).where(and(gte(mtnTransactions.transactionDate,startDate),lte(mtnTransactions.transactionDate,endDate),eq(mtnTransactions.reconciliationStatus,"unmatched"),eq(mtnTransactions.status,"completed")));
      result.unmatched = unmatched.length;
      if (autoReconcile && mtnReconciliationRules) {
        const rules = await db.select().from(mtnReconciliationRules).where(eq(mtnReconciliationRules.isActive,true)).orderBy(mtnReconciliationRules.priority);
        for (const txn of unmatched) {
          const r = await this._tryMatch(db, txn, rules, mtnTransactions);
          if (r) { result.matched++; result.unmatched--; }
        }
      }
      await db.update(mtnSyncHistory).set({ status:"completed", transactionsFetched:unmatched.length, transactionsMatched:result.matched, completedAt:new Date() }).where(eq(mtnSyncHistory.id,syncId));
    } catch(e:any) { result.errors.push(e?.message||String(e)); }
    return result;
  }

  private async _tryMatch(db:any, txn:any, rules:any[], mtnTransactions:any): Promise<boolean> {
    const amount = parseFloat(txn.amount.toString());
    for (const rule of rules) {
      let ok = false;
      if (rule.matchType==="exact_amount") ok = rule.amountMin && Math.abs(amount - parseFloat(rule.amountMin))<1;
      else if (rule.matchType==="amount_range") ok = amount>=parseFloat(rule.amountMin||"0") && amount<=parseFloat(rule.amountMax||"999999999");
      else if (rule.matchType==="phone_number") ok = !!rule.phonePattern && txn.payerPhoneNumber?.includes(rule.phonePattern);
      else if (rule.matchType==="reference_id") ok = !!rule.referencePattern && txn.referenceId?.includes(rule.referencePattern);
      if (!ok) continue;
      const receivables = await db.select().from(accountsReceivable).where(eq(accountsReceivable.status,"partial")).limit(20);
      const match = receivables.find((r:any)=>Math.abs(parseFloat(r.balanceRemaining.toString())-amount)<1);
      if (match) {
        await db.update(mtnTransactions).set({reconciliationStatus:"matched",matchedReceivableId:match.id}).where(eq(mtnTransactions.id,txn.id));
        const newPaid = parseFloat(match.amountPaid.toString())+amount;
        const newBal = Math.max(0,parseFloat(match.invoiceAmount.toString())-newPaid);
        await db.update(accountsReceivable).set({amountPaid:newPaid.toString(),balanceRemaining:newBal.toString(),status:newBal<=0?"paid":"partial"}).where(eq(accountsReceivable.id,match.id));
        return true;
      }
    }
    return false;
  }

  async getReconciliationStatus(): Promise<ReconciliationStatus> {
    const db = await getDb(); if (!db) return { totalTransactions:0,matched:0,unmatched:0,disputed:0,lastSync:null };
    const { mtnTransactions, mtnSyncHistory } = await getMtnTables();
    if (!mtnTransactions) return { totalTransactions:0,matched:0,unmatched:0,disputed:0,lastSync:null };
    const all = await db.select().from(mtnTransactions);
    const lastSync = await db.select().from(mtnSyncHistory).where(eq(mtnSyncHistory.status,"completed")).orderBy(desc(mtnSyncHistory.completedAt)).limit(1);
    return {
      totalTransactions: all.length,
      matched: all.filter((t:any)=>["matched","confirmed"].includes(t.reconciliationStatus)).length,
      unmatched: all.filter((t:any)=>t.reconciliationStatus==="unmatched").length,
      disputed: all.filter((t:any)=>t.reconciliationStatus==="disputed").length,
      lastSync: lastSync[0]?.completedAt ?? null,
    };
  }

  async getUnmatchedTransactions(limit=50): Promise<any[]> {
    const db = await getDb(); if (!db) return [];
    const { mtnTransactions } = await getMtnTables(); if (!mtnTransactions) return [];
    return db.select().from(mtnTransactions).where(eq(mtnTransactions.reconciliationStatus,"unmatched")).orderBy(desc(mtnTransactions.transactionDate)).limit(limit);
  }

  async getTransactionHistory(startDate:Date, endDate:Date, limit=100): Promise<any[]> {
    const db = await getDb(); if (!db) return [];
    const { mtnTransactions } = await getMtnTables(); if (!mtnTransactions) return [];
    return db.select().from(mtnTransactions).where(and(gte(mtnTransactions.transactionDate,startDate),lte(mtnTransactions.transactionDate,endDate))).orderBy(desc(mtnTransactions.transactionDate)).limit(limit);
  }

  async manuallyReconcile(mtnTransactionId:string, receivableId:number): Promise<void> {
    const db = await getDb(); if (!db) throw new Error("DB unavailable");
    const { mtnTransactions } = await getMtnTables(); if (!mtnTransactions) return;
    await db.update(mtnTransactions).set({reconciliationStatus:"confirmed",matchedReceivableId:receivableId}).where(eq(mtnTransactions.mtnTransactionId,mtnTransactionId));
  }

  async reportDispute(mtnTransactionId:string, reason:string, description:string): Promise<void> {
    const db = await getDb(); if (!db) throw new Error("DB unavailable");
    const { mtnTransactions, mtnDisputes } = await getMtnTables(); if (!mtnTransactions) return;
    await db.update(mtnTransactions).set({reconciliationStatus:"disputed"}).where(eq(mtnTransactions.mtnTransactionId,mtnTransactionId));
    if (mtnDisputes) await db.insert(mtnDisputes).values({mtnTransactionId,reason,description,status:"open",reportedBy:1});
  }

  async storeTransaction(data: MtnTransactionData): Promise<void> {
    const db = await getDb(); if (!db) return;
    const { mtnTransactions } = await getMtnTables(); if (!mtnTransactions) return;
    try {
      await db.insert(mtnTransactions).values({mtnTransactionId:data.mtnTransactionId,referenceId:data.referenceId,amount:data.amount.toString(),currency:data.currency,payerPhoneNumber:data.payerPhoneNumber,payerName:data.payerName,payeePhoneNumber:data.payeePhoneNumber,description:data.description,transactionType:data.transactionType,status:data.status,reconciliationStatus:"unmatched",transactionDate:data.transactionDate,syncedAt:new Date()});
    } catch(e:any) { if (e?.code!=="ER_DUP_ENTRY") throw e; }
  }
}
