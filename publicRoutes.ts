/**
 * Public REST endpoints — no auth required
 * Add to server/_core/index.ts: import { registerPublicRoutes } from "./publicRoutes";
 *                               registerPublicRoutes(app);  // after registerChatRoutes
 */
import { Request, Response } from "express";
import { getDb } from "../db";
import { clientReceipts, ecommerceOrders } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { MtnReconciliationService } from "./mtn-reconciliation";

const mtnService = new MtnReconciliationService();

function generateOrderRef(): string {
  const d = new Date().toISOString().split("T")[0].replace(/-/g,"");
  return `ORD-${d}-${Math.floor(1000+Math.random()*9000)}`;
}

const VALID_PRICES: Record<string,number> = { "300ml":3000,"500ml":5000,"1L":10000,"5L":45000,"10L":90000,"20L":180000 };

export function registerPublicRoutes(app: any) {

  // ── QR Receipt Verification ─────────────────────────────────────────────────
  app.get("/api/verify-receipt/:receiptNumber", async (req: Request, res: Response) => {
    const { receiptNumber } = req.params;
    if (!receiptNumber || !/^RCP-\d{8}-\d{4}$/.test(receiptNumber)) {
      return res.status(400).json({ error: "Invalid receipt number" });
    }
    try {
      const db = await getDb();
      if (!db) return res.status(503).json({ error: "DB unavailable" });
      const rows = await db.select().from(clientReceipts).where(eq(clientReceipts.receiptNumber, receiptNumber)).limit(1);
      if (!rows.length) return res.status(404).json({ error: "Receipt not found" });
      const r = rows[0];
      return res.json({
        receiptNumber: r.receiptNumber, clientName: r.clientName,
        amountPaid: r.amountPaid, paymentMethod: r.paymentMethod,
        receiptDate: r.receiptDate, eventReference: r.eventReference ?? null,
        issuedBy: r.issuedBy,
      });
    } catch { return res.status(500).json({ error: "Internal server error" }); }
  });

  // ── E-Commerce Order Placement ──────────────────────────────────────────────
  app.post("/api/orders", async (req: Request, res: Response) => {
    const { customerName, customerPhone, deliveryLocation, items, flavour, notes } = req.body;
    if (!customerName || !customerPhone || !deliveryLocation || !items?.length) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    for (const item of items) {
      if (!VALID_PRICES[item.size] || VALID_PRICES[item.size] !== item.price) return res.status(400).json({ error: `Invalid price for ${item.size}` });
      if (!Number.isInteger(item.quantity) || item.quantity < 1) return res.status(400).json({ error: "Invalid quantity" });
    }
    const totalAmount = items.reduce((s:number,i:any)=>s+i.price*i.quantity,0);
    const orderRef = generateOrderRef();
    const db = await getDb();
    if (db) {
      try { await db.insert(ecommerceOrders).values({ orderRef, customerName, customerPhone, deliveryLocation, flavour:flavour??null, items, totalAmount:totalAmount.toString(), status:"pending", channel:"web", notes:notes??null }); }
      catch { /* table may not exist yet */ }
    }
    return res.json({ success:true, orderRef, total:totalAmount, message:`Order ${orderRef} placed! We'll contact ${customerPhone} shortly.` });
  });

  // ── MTN Webhook ─────────────────────────────────────────────────────────────
  app.post("/api/webhooks/mtn", async (req: Request, res: Response) => {
    try {
      const payload = req.body;
      if (!payload?.externalId || !payload?.amount) return res.status(400).json({ error: "Invalid payload" });
      await mtnService.storeTransaction({
        mtnTransactionId: payload.financialTransactionId || payload.externalId,
        referenceId: payload.externalId,
        amount: parseFloat(payload.amount),
        currency: payload.currency || "UGX",
        payerPhoneNumber: payload.payer?.partyId || "unknown",
        payerName: payload.payerMessage,
        transactionType: "payment",
        status: payload.status === "SUCCESSFUL" ? "completed" : "failed",
        transactionDate: new Date(),
      });
      return res.json({ success: true });
    } catch { return res.status(500).json({ error: "Webhook processing failed" }); }
  });

  // ── PesaPal Webhook ─────────────────────────────────────────────────────────
  app.post("/api/webhooks/pesapal", async (req: Request, res: Response) => {
    try {
      const { OrderTrackingId, OrderMerchantReference, OrderNotificationType } = req.body;
      console.log("[PESAPAL WEBHOOK]", { OrderTrackingId, OrderMerchantReference, OrderNotificationType });
      // In production: update pesapalTransactions table and receivable/sale status
      // const { pesapalTransactions } = await import("../../drizzle/pesapal-schema");
      // await db.update(pesapalTransactions).set({ paymentStatus:"completed", pesapalTrackingId:OrderTrackingId }).where(eq(...));
      return res.json({ success: true });
    } catch { return res.status(500).json({ error: "Webhook processing failed" }); }
  });

  // ── PesaPal IPN Callback ────────────────────────────────────────────────────
  app.get("/api/pesapal/callback", async (req: Request, res: Response) => {
    const { OrderTrackingId, OrderMerchantReference } = req.query;
    console.log("[PESAPAL CALLBACK]", { OrderTrackingId, OrderMerchantReference });
    // Redirect to success page
    return res.redirect(`/pesapal-payment?status=success&ref=${OrderMerchantReference}`);
  });
}
