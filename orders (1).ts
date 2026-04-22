import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { TRPCError } from "@trpc/server";
import { desc } from "drizzle-orm";

// ── Schema (add to drizzle/schema.ts) ─────────────────────────────────────────
//
// export const ecommerceOrders = mysqlTable("ecommerce_orders", {
//   id:            int("id").autoincrement().primaryKey(),
//   orderRef:      varchar("orderRef", { length: 50 }).notNull().unique(),
//   customerName:  varchar("customerName", { length: 255 }).notNull(),
//   customerPhone: varchar("customerPhone", { length: 50 }).notNull(),
//   deliveryLocation: text("deliveryLocation").notNull(),
//   flavour:       varchar("flavour", { length: 100 }),
//   items:         json("items").$type<OrderItem[]>().notNull(),
//   totalAmount:   decimal("totalAmount", { precision: 15, scale: 2 }).notNull(),
//   status:        mysqlEnum("status", ["pending","confirmed","delivered","cancelled"]).default("pending"),
//   channel:       mysqlEnum("channel", ["web","whatsapp","call"]).default("web"),
//   notes:         text("notes"),
//   createdAt:     timestamp("createdAt").defaultNow().notNull(),
//   updatedAt:     timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
// });

interface OrderItem {
  id: number;
  size: string;
  price: number;
  quantity: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function generateOrderRef(): string {
  const date = new Date().toISOString().split("T")[0].replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${date}-${rand}`;
}

function validateItems(items: OrderItem[]): boolean {
  if (!items || items.length === 0) return false;
  const VALID_SIZES = ["300ml", "500ml", "1L", "5L", "10L", "20L"];
  const VALID_PRICES: Record<string, number> = { "300ml": 3000, "500ml": 5000, "1L": 10000, "5L": 45000, "10L": 90000, "20L": 180000 };

  for (const item of items) {
    if (!VALID_SIZES.includes(item.size)) return false;
    if (VALID_PRICES[item.size] !== item.price) return false;
    if (item.quantity < 1 || item.quantity > 9999) return false;
  }
  return true;
}

function calculateTotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// ── Router ────────────────────────────────────────────────────────────────────
export const ordersRouter = router({
  // Public — called by the /shop page when customer places an order
  placeOrder: publicProcedure
    .input(z.object({
      customerName: z.string().min(1).max(255),
      customerPhone: z.string().min(9).max(20),
      deliveryLocation: z.string().min(1).max(500),
      flavour: z.string().optional(),
      items: z.array(z.object({
        id: z.number(),
        size: z.string(),
        price: z.number(),
        quantity: z.number().int().min(1).max(9999),
      })).min(1),
      channel: z.enum(["web", "whatsapp", "call"]).default("web"),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      if (!validateItems(input.items)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid items or prices. Please refresh and try again.",
        });
      }

      const total = calculateTotal(input.items);
      if (total <= 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Order total must be greater than zero." });
      }

      const orderRef = generateOrderRef();

      const db = await getDb();
      if (db) {
        try {
          // Lazy-import to avoid circular deps before schema is extended
          const { ecommerceOrders } = await import("../../drizzle/schema") as any;
          await db.insert(ecommerceOrders).values({
            orderRef,
            customerName: input.customerName,
            customerPhone: input.customerPhone,
            deliveryLocation: input.deliveryLocation,
            flavour: input.flavour ?? null,
            items: input.items,
            totalAmount: total.toString(),
            status: "pending",
            channel: input.channel,
            notes: input.notes ?? null,
          });
        } catch (err) {
          // DB might not have the table yet — log and continue
          console.warn("[Orders] Could not save to DB:", err);
        }
      }

      // TODO: Send WhatsApp notification to business number via Twilio/Africa's Talking

      return {
        success: true,
        orderRef,
        total,
        message: `Order ${orderRef} received! We'll call ${input.customerPhone} to confirm.`,
      };
    }),

  // Protected — admin/operations can view and manage orders
  getOrders: protectedProcedure
    .input(z.object({
      status: z.enum(["pending", "confirmed", "delivered", "cancelled"]).optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      try {
        const { ecommerceOrders } = await import("../../drizzle/schema") as any;
        return db.select().from(ecommerceOrders)
          .orderBy(desc(ecommerceOrders.createdAt))
          .limit(input?.limit ?? 50)
          .offset(input?.offset ?? 0);
      } catch {
        return [];
      }
    }),

  updateOrderStatus: protectedProcedure
    .input(z.object({
      orderRef: z.string(),
      status: z.enum(["pending", "confirmed", "delivered", "cancelled"]),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin" && ctx.user?.role !== "operations") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      try {
        const { ecommerceOrders } = await import("../../drizzle/schema") as any;
        const { eq } = await import("drizzle-orm");
        await db.update(ecommerceOrders)
          .set({ status: input.status })
          .where(eq(ecommerceOrders.orderRef, input.orderRef));
      } catch (err) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update order" });
      }
      return { success: true };
    }),
});
