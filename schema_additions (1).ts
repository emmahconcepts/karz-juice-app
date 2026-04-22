// ─────────────────────────────────────────────────────────────────────────────
// ADD TO drizzle/schema.ts
// Paste these two blocks into schema.ts exactly as shown.
// Then run: pnpm db:push
// ─────────────────────────────────────────────────────────────────────────────

// 1. UPDATE expenses table — add new categories to the enum
//    Replace the existing `category` field in the `expenses` table with:
//
//    category: mysqlEnum("category", [
//      "general",
//      "machine_hire",
//      "vehicle_hire",
//      "utilities",
//      "ingredients",
//      "packaging_materials",   // NEW
//      "wages_salaries",        // NEW
//    ]).notNull(),
//
// After editing, run: pnpm db:push

// 2. NEW TABLE — E-Commerce Orders (paste after the userApprovals table)

import {
  int, mysqlEnum, mysqlTable, text, timestamp,
  varchar, decimal, json,
} from "drizzle-orm/mysql-core";

interface OrderItem {
  id: number;
  size: string;
  price: number;
  quantity: number;
}

export const ecommerceOrders = mysqlTable("ecommerce_orders", {
  id:               int("id").autoincrement().primaryKey(),
  orderRef:         varchar("orderRef", { length: 50 }).notNull().unique(),
  customerName:     varchar("customerName", { length: 255 }).notNull(),
  customerPhone:    varchar("customerPhone", { length: 50 }).notNull(),
  deliveryLocation: text("deliveryLocation").notNull(),
  flavour:          varchar("flavour", { length: 100 }),
  items:            json("items").$type<OrderItem[]>().notNull(),
  totalAmount:      decimal("totalAmount", { precision: 15, scale: 2 }).notNull(),
  status:           mysqlEnum("status", ["pending", "confirmed", "delivered", "cancelled"]).default("pending").notNull(),
  channel:          mysqlEnum("channel", ["web", "whatsapp", "call"]).default("web").notNull(),
  notes:            text("notes"),
  createdAt:        timestamp("createdAt").defaultNow().notNull(),
  updatedAt:        timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EcommerceOrder = typeof ecommerceOrders.$inferSelect;
export type InsertEcommerceOrder = typeof ecommerceOrders.$inferInsert;
