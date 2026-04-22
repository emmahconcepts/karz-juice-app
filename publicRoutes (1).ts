// ─────────────────────────────────────────────────────────────────────────────
// ADD TO server/_core/index.ts  (after the tRPC middleware registration)
//
// This creates the public GET /api/verify-receipt/:receiptNumber endpoint
// used by ReceiptVerifyPage.tsx and the QR code links.
// It returns ONLY safe public fields — never exposes internal IDs or PDF URLs.
// ─────────────────────────────────────────────────────────────────────────────

import { Request, Response } from "express";
import { getDb } from "../db";
import { clientReceipts } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export function registerPublicRoutes(app: any) {
  // Public receipt verification — no auth required
  // Called by QR codes and ReceiptVerifyPage.tsx
  app.get("/api/verify-receipt/:receiptNumber", async (req: Request, res: Response) => {
    const { receiptNumber } = req.params;

    if (!receiptNumber || !/^RCP-\d{8}-\d{4}$/.test(receiptNumber)) {
      return res.status(400).json({ error: "Invalid receipt number format" });
    }

    try {
      const db = await getDb();
      if (!db) return res.status(503).json({ error: "Database unavailable" });

      const rows = await db
        .select()
        .from(clientReceipts)
        .where(eq(clientReceipts.receiptNumber, receiptNumber))
        .limit(1);

      if (!rows.length) {
        return res.status(404).json({ error: "Receipt not found" });
      }

      const r = rows[0];

      // Return ONLY public-safe fields
      return res.json({
        receiptNumber: r.receiptNumber,
        clientName: r.clientName,
        amountPaid: r.amountPaid,
        paymentMethod: r.paymentMethod,
        receiptDate: r.receiptDate,
        eventReference: r.eventReference ?? null,
        issuedBy: r.issuedBy,
        // Do NOT include: id, pdfUrl, emailSent, qrCode (internal)
      });
    } catch (err) {
      console.error("[verify-receipt]", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // E-Commerce order placement — public, no auth
  // Called by EcommerceLanding.tsx checkout flow
  app.post("/api/orders", async (req: Request, res: Response) => {
    const { customerName, customerPhone, deliveryLocation, items, flavour, notes } = req.body;

    if (!customerName || !customerPhone || !deliveryLocation || !items?.length) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const VALID_PRICES: Record<string, number> = {
      "300ml": 3000, "500ml": 5000, "1L": 10000,
      "5L": 45000, "10L": 90000, "20L": 180000,
    };

    // Validate items and prices
    for (const item of items) {
      if (!VALID_PRICES[item.size] || VALID_PRICES[item.size] !== item.price) {
        return res.status(400).json({ error: `Invalid item or price for ${item.size}` });
      }
      if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 9999) {
        return res.status(400).json({ error: `Invalid quantity for ${item.size}` });
      }
    }

    const totalAmount = items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
    const date = new Date().toISOString().split("T")[0].replace(/-/g, "");
    const rand = Math.floor(1000 + Math.random() * 9000);
    const orderRef = `ORD-${date}-${rand}`;

    try {
      const db = await getDb();
      if (db) {
        try {
          const { ecommerceOrders } = await import("../../drizzle/schema") as any;
          await db.insert(ecommerceOrders).values({
            orderRef, customerName, customerPhone, deliveryLocation,
            flavour: flavour ?? null,
            items,
            totalAmount: totalAmount.toString(),
            status: "pending",
            channel: "web",
            notes: notes ?? null,
          });
        } catch (dbErr) {
          // Log but don't fail the order — table may not exist yet
          console.warn("[orders] DB insert failed:", dbErr);
        }
      }

      return res.json({
        success: true,
        orderRef,
        total: totalAmount,
        message: `Order ${orderRef} placed! We'll contact ${customerPhone} to confirm.`,
      });
    } catch (err) {
      console.error("[orders]", err);
      return res.status(500).json({ error: "Failed to place order" });
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// HOW TO WIRE IN:
//
// In server/_core/index.ts, add this import at the top:
//   import { registerPublicRoutes } from "./publicRoutes";
//
// Then after registerChatRoutes(app), add:
//   registerPublicRoutes(app);
//
// ─────────────────────────────────────────────────────────────────────────────
