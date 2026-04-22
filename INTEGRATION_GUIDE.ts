// Append these procedures to the existing adminRouter in server/routers/admin.ts
// ──────────────────────────────────────────────────────────────────────────────
// Add these imports at the top of admin.ts:
//   import { userApprovals } from "../../drizzle/schema";
//
// Then add these procedures inside the adminRouter object:

/*
  // ──────────────────────────────────────────────────────
  // USER APPROVAL WORKFLOW
  // ──────────────────────────────────────────────────────

  getPendingUsers: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    // Join users with their approval status
    const allUsers = await db.select().from(users);
    const allApprovals = await db.select().from(userApprovals);

    return allUsers.map(u => {
      const approval = allApprovals.find(a => a.userId === u.id);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
        approvalStatus: (approval?.status ?? "pending") as "pending" | "approved" | "rejected",
        approvalId: approval?.id,
        rejectionReason: approval?.rejectionReason,
      };
    });
  }),

  approveUser: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const existing = await db
        .select()
        .from(userApprovals)
        .where(eq(userApprovals.userId, input.userId))
        .limit(1);

      if (existing.length) {
        await db.update(userApprovals).set({
          status: "approved",
          approvedBy: ctx.user!.id,
          approvalDate: new Date(),
          rejectionReason: null,
        }).where(eq(userApprovals.userId, input.userId));
      } else {
        await db.insert(userApprovals).values({
          userId: input.userId,
          status: "approved",
          approvedBy: ctx.user!.id,
          approvalDate: new Date(),
        });
      }
      return { success: true };
    }),

  rejectUser: adminProcedure
    .input(z.object({ userId: z.number(), reason: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const existing = await db
        .select()
        .from(userApprovals)
        .where(eq(userApprovals.userId, input.userId))
        .limit(1);

      if (existing.length) {
        await db.update(userApprovals).set({
          status: "rejected",
          approvedBy: ctx.user!.id,
          approvalDate: new Date(),
          rejectionReason: input.reason ?? null,
        }).where(eq(userApprovals.userId, input.userId));
      } else {
        await db.insert(userApprovals).values({
          userId: input.userId,
          status: "rejected",
          approvedBy: ctx.user!.id,
          approvalDate: new Date(),
          rejectionReason: input.reason ?? null,
        });
      }
      return { success: true };
    }),

  // ──────────────────────────────────────────────────────
  // DELETE FUNCTIONS AUDIT — stub implementations
  // Add to each module router individually after audit
  // ──────────────────────────────────────────────────────

  // Example pattern for safe deletes with ledger check:
  //
  // deleteWithCheck: adminProcedure
  //   .input(z.object({ id: z.number(), table: z.string() }))
  //   .mutation(async ({ input }) => {
  //     const db = await getDb();
  //     // 1. Check for dependent ledger entries
  //     // 2. If found, return error with cascade warning
  //     // 3. Otherwise, soft-delete (set isActive = false) or hard-delete
  //     // 4. Log to audit trail
  //   }),
*/

// ──────────────────────────────────────────────────────────────────────────────
// UPDATED routers.ts — add these lines:
// ──────────────────────────────────────────────────────────────────────────────
//
// import { packagesRouter } from "./routers/packages";
// import { receiptsRouter } from "./routers/receipts";
// import { searchRouter } from "./routers/search";
//
// Then inside appRouter:
//   packages: packagesRouter,
//   receipts: receiptsRouter,
//   search: searchRouter,
//
// ──────────────────────────────────────────────────────────────────────────────
// UPDATED App.tsx — add these routes:
// ──────────────────────────────────────────────────────────────────────────────
//
// import PackagesModule from "./pages/PackagesModule";
// import ClientReceiptsModule from "./pages/ClientReceiptsModule";
// import ReceiptVerifyPage from "./pages/ReceiptVerifyPage";
// import LoginPage from "./pages/LoginPage";
//
// In AppContent():
//   if (pathname === "/login") return <LoginPage />;
//   if (pathname.startsWith("/verify/")) return <ReceiptVerifyPage />;  // public, no auth wrapper
//
// In DashboardRouter():
//   <Route path="/packages" component={PackagesModule} />
//   <Route path="/client-receipts" component={ClientReceiptsModule} />
//
// ──────────────────────────────────────────────────────────────────────────────
// UPDATED DashboardLayout.tsx — add menu items + GlobalSearch:
// ──────────────────────────────────────────────────────────────────────────────
//
// import GlobalSearch from "./GlobalSearch";
//
// Add to menuItems array:
//   { icon: Package, label: "Packages", path: "/packages", public: true },
//   { icon: Receipt, label: "Client Receipts", path: "/client-receipts", public: true },
//
// In the layout header JSX, add:
//   <GlobalSearch />
//
// ──────────────────────────────────────────────────────────────────────────────
// UPDATED AdminDashboard.tsx — add UserApprovalPanel:
// ──────────────────────────────────────────────────────────────────────────────
//
// import UserApprovalPanel from "../components/UserApprovalPanel";
//
// Add a new tab or section in the admin dashboard:
//   <UserApprovalPanel />
//
// ──────────────────────────────────────────────────────────────────────────────
// PUBLIC API ENDPOINT — add to express/server for QR verification:
// ──────────────────────────────────────────────────────────────────────────────
//
// app.get("/api/verify-receipt/:receiptNumber", async (req, res) => {
//   // Calls receiptsRouter.verifyReceipt({ receiptNumber: req.params.receiptNumber })
//   // Returns only safe public fields
// });

export {};
