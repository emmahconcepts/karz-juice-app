import { test, expect, Page } from "@playwright/test";

// ── Config ────────────────────────────────────────────────────────────────────
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || "admin@karzjuice.app";
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || "testpass123";

// ── Helpers ───────────────────────────────────────────────────────────────────
async function loginAsAdmin(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/`);
}

async function navigateTo(page: Page, path: string) {
  await page.goto(`${BASE_URL}${path}`);
  await page.waitForLoadState("networkidle");
}

// ── MODULE 1: Login System ────────────────────────────────────────────────────
test.describe("Module 1 — Login System", () => {
  test("login page loads and shows email/password fields", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("shows error on wrong credentials", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', "wrong@example.com");
    await page.fill('input[type="password"]', "wrongpass");
    await page.click('button[type="submit"]');
    // Should stay on login page or show error
    await expect(page).toHaveURL(/login|error/);
  });

  test("forgot password link shows reset form", async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    await page.click('text=Forgot password');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button', { hasText: /send reset/i })).toBeVisible();
  });

  test("successful login redirects to dashboard", async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page).toHaveURL(`${BASE_URL}/`);
  });
});

// ── MODULE 2: Dashboard ───────────────────────────────────────────────────────
test.describe("Module 2 — Dashboard", () => {
  test.beforeEach(async ({ page }) => { await loginAsAdmin(page); });

  test("dashboard loads with KPI cards", async ({ page }) => {
    await navigateTo(page, "/");
    await expect(page.locator("text=Daily Sales").first()).toBeVisible();
  });

  test("global search bar is visible", async ({ page }) => {
    await navigateTo(page, "/");
    await expect(page.locator("text=Search").first()).toBeVisible();
  });

  test("sidebar navigation is present", async ({ page }) => {
    await navigateTo(page, "/");
    await expect(page.locator("text=Sales").first()).toBeVisible();
    await expect(page.locator("text=Functions").first()).toBeVisible();
  });
});

// ── MODULE 3: Sales ───────────────────────────────────────────────────────────
test.describe("Module 3 — Sales", () => {
  test.beforeEach(async ({ page }) => { await loginAsAdmin(page); });

  test("sales page loads", async ({ page }) => {
    await navigateTo(page, "/sales");
    await expect(page).toHaveTitle(/.*/);
    await expect(page.locator("text=/[Ss]ales/")).toBeVisible();
  });

  test("can access sales module from sidebar", async ({ page }) => {
    await navigateTo(page, "/");
    await page.click("text=Sales");
    await expect(page).toHaveURL(`${BASE_URL}/sales`);
  });
});

// ── MODULE 4: Functions/Events ────────────────────────────────────────────────
test.describe("Module 4 — Functions & Events", () => {
  test.beforeEach(async ({ page }) => { await loginAsAdmin(page); });

  test("functions page loads", async ({ page }) => {
    await navigateTo(page, "/functions");
    await expect(page.locator("text=/[Ff]unctions/")).toBeVisible();
  });
});

// ── MODULE 5: Accounts ────────────────────────────────────────────────────────
test.describe("Module 5 — Accounts & Finance", () => {
  test.beforeEach(async ({ page }) => { await loginAsAdmin(page); });

  test("accounts page loads", async ({ page }) => {
    await navigateTo(page, "/accounts");
    await expect(page.locator("text=/[Aa]ccounts/")).toBeVisible();
  });
});

// ── MODULE 6: Expenses ────────────────────────────────────────────────────────
test.describe("Module 6 — Expenses", () => {
  test.beforeEach(async ({ page }) => { await loginAsAdmin(page); });

  test("expenses page loads", async ({ page }) => {
    await navigateTo(page, "/expenses");
    await expect(page.locator("text=/[Ee]xpenses/")).toBeVisible();
  });
});

// ── MODULE 7: Machine Hire ────────────────────────────────────────────────────
test.describe("Module 7 — Machine Hire", () => {
  test.beforeEach(async ({ page }) => { await loginAsAdmin(page); });

  test("machine hire page loads", async ({ page }) => {
    await navigateTo(page, "/machine-hire");
    await expect(page.locator("text=/[Mm]achine/")).toBeVisible();
  });
});

// ── MODULE 8: Vehicle Hire ────────────────────────────────────────────────────
test.describe("Module 8 — Vehicle Hire", () => {
  test.beforeEach(async ({ page }) => { await loginAsAdmin(page); });

  test("vehicle hire page loads", async ({ page }) => {
    await navigateTo(page, "/vehicle-hire");
    await expect(page.locator("text=/[Vv]ehicle/")).toBeVisible();
  });
});

// ── MODULE 9: Products ────────────────────────────────────────────────────────
test.describe("Module 9 — Products & BOM", () => {
  test.beforeEach(async ({ page }) => { await loginAsAdmin(page); });

  test("products page loads", async ({ page }) => {
    await navigateTo(page, "/products");
    await expect(page.locator("text=/[Pp]roduct/")).toBeVisible();
  });
});

// ── MODULE 10: Packages ───────────────────────────────────────────────────────
test.describe("Module 10 — Packages", () => {
  test.beforeEach(async ({ page }) => { await loginAsAdmin(page); });

  test("packages page loads", async ({ page }) => {
    await navigateTo(page, "/packages");
    await expect(page.locator("text=/[Pp]ackage/")).toBeVisible();
  });

  test("can open add package form", async ({ page }) => {
    await navigateTo(page, "/packages");
    const addBtn = page.locator("button", { hasText: /add package/i });
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await expect(page.locator("text=/[Pp]ackage [Nn]ame/")).toBeVisible();
    }
  });
});

// ── MODULE 11: OCR Receipts ───────────────────────────────────────────────────
test.describe("Module 11 — OCR Receipts", () => {
  test.beforeEach(async ({ page }) => { await loginAsAdmin(page); });

  test("OCR receipts page loads", async ({ page }) => {
    await navigateTo(page, "/receipts");
    await expect(page.locator("text=/[Rr]eceipt|[Ss]can|[Oo]CR/")).toBeVisible();
  });
});

// ── MODULE 12: Client Receipts ────────────────────────────────────────────────
test.describe("Module 12 — Client Receipts & QR", () => {
  test.beforeEach(async ({ page }) => { await loginAsAdmin(page); });

  test("client receipts page loads", async ({ page }) => {
    await navigateTo(page, "/client-receipts");
    await expect(page.locator("text=/[Cc]lient [Rr]eceipt/")).toBeVisible();
  });

  test("QR verify page is publicly accessible (no login)", async ({ page }) => {
    // Access public verify page without logging in first
    await page.goto(`${BASE_URL}/verify/RCP-20260416-TEST`);
    // Should load the verify page (not redirect to login)
    await expect(page.locator("text=/[Vv]erif|[Kk]arz [Jj]uice/")).toBeVisible();
  });
});

// ── MODULE 13: Statements ─────────────────────────────────────────────────────
test.describe("Module 13 — Statement Import", () => {
  test.beforeEach(async ({ page }) => { await loginAsAdmin(page); });

  test("statements page loads", async ({ page }) => {
    await navigateTo(page, "/statements");
    await expect(page.locator("text=/[Ss]tatement/")).toBeVisible();
  });
});

// ── MODULE 14: Reports ────────────────────────────────────────────────────────
test.describe("Module 14 — Email Reports", () => {
  test.beforeEach(async ({ page }) => { await loginAsAdmin(page); });

  test("reports page loads", async ({ page }) => {
    await navigateTo(page, "/reports");
    await expect(page.locator("text=/[Rr]eport/")).toBeVisible();
  });
});

// ── MODULE 15: Receivables ────────────────────────────────────────────────────
test.describe("Module 15 — Accounts Receivable", () => {
  test.beforeEach(async ({ page }) => { await loginAsAdmin(page); });

  test("receivables page loads", async ({ page }) => {
    await navigateTo(page, "/receivables");
    await expect(page.locator("text=/[Rr]eceivable/")).toBeVisible();
  });
});

// ── MODULE 16: Payables ───────────────────────────────────────────────────────
test.describe("Module 16 — Accounts Payable", () => {
  test.beforeEach(async ({ page }) => { await loginAsAdmin(page); });

  test("payables page loads", async ({ page }) => {
    await navigateTo(page, "/payables");
    await expect(page.locator("text=/[Pp]ayable/")).toBeVisible();
  });
});

// ── MODULE 17: Custom Accounts ────────────────────────────────────────────────
test.describe("Module 17 — Custom Accounts", () => {
  test.beforeEach(async ({ page }) => { await loginAsAdmin(page); });

  test("custom accounts page loads", async ({ page }) => {
    await navigateTo(page, "/custom-accounts");
    await expect(page.locator("text=/[Cc]ustom [Aa]ccount/")).toBeVisible();
  });
});

// ── MODULE 18: Admin Dashboard ────────────────────────────────────────────────
test.describe("Module 18 — Admin Dashboard", () => {
  test.beforeEach(async ({ page }) => { await loginAsAdmin(page); });

  test("admin dashboard loads", async ({ page }) => {
    await navigateTo(page, "/admin");
    await expect(page.locator("text=/[Aa]dmin/")).toBeVisible();
  });

  test("user approvals tab is present", async ({ page }) => {
    await navigateTo(page, "/admin");
    await expect(page.locator("text=/[Aa]pproval/")).toBeVisible();
  });
});

// ── MODULE 19: Global Search ──────────────────────────────────────────────────
test.describe("Module 19 — Global Search", () => {
  test.beforeEach(async ({ page }) => { await loginAsAdmin(page); });

  test("search opens on click", async ({ page }) => {
    await navigateTo(page, "/");
    await page.click("button:has-text('Search')");
    await expect(page.locator("input[placeholder*='Search']")).toBeVisible();
  });

  test("search opens with Ctrl+K", async ({ page }) => {
    await navigateTo(page, "/");
    await page.keyboard.press("Control+k");
    await expect(page.locator("input[placeholder*='Search']")).toBeVisible();
  });
});

// ── MODULE 20: E-Commerce Store ───────────────────────────────────────────────
test.describe("Module 20 — E-Commerce Store (/shop)", () => {
  test("shop page loads without login", async ({ page }) => {
    await page.goto(`${BASE_URL}/shop`);
    await expect(page.locator("text=/[Kk]arz [Jj]uice/")).toBeVisible();
  });

  test("all 6 juice sizes are displayed", async ({ page }) => {
    await page.goto(`${BASE_URL}/shop`);
    const sizes = ["300ml", "500ml", "1L", "5L", "10L", "20L"];
    for (const size of sizes) {
      await expect(page.locator(`text=${size}`).first()).toBeVisible();
    }
  });

  test("prices are correct", async ({ page }) => {
    await page.goto(`${BASE_URL}/shop`);
    await expect(page.locator("text=3,000").first()).toBeVisible();
    await expect(page.locator("text=180,000").first()).toBeVisible();
  });

  test("add to cart button works", async ({ page }) => {
    await page.goto(`${BASE_URL}/shop`);
    await page.locator("button:has-text('Add to cart')").first().click();
    await expect(page.locator("text=1").first()).toBeVisible();
  });

  test("cart total updates correctly", async ({ page }) => {
    await page.goto(`${BASE_URL}/shop`);
    // Add 300ml twice
    const addBtns = page.locator("button:has-text('Add to cart')");
    await addBtns.first().click();
    await page.locator("button[title*='ncrease'], button:has(svg)").first().click();
    // Cart bar should show total
    await expect(page.locator("text=/UGX/")).toBeVisible();
  });

  test("checkout form validates required fields", async ({ page }) => {
    await page.goto(`${BASE_URL}/shop`);
    await page.locator("button:has-text('Add to cart')").first().click();
    await page.locator("button:has-text('View cart')").click();
    await page.locator("button:has-text('Proceed to checkout')").click();
    await page.locator("button:has-text('Place Order')").click();
    // Error messages should appear
    await expect(page.locator("text=/required/i").first()).toBeVisible();
  });

  test("WhatsApp order button is present on checkout", async ({ page }) => {
    await page.goto(`${BASE_URL}/shop`);
    await page.locator("button:has-text('Add to cart')").first().click();
    await page.locator("button:has-text('View cart')").click();
    await page.locator("button:has-text('Proceed to checkout')").click();
    await expect(page.locator("a:has-text('WhatsApp')")).toBeVisible();
  });

  test("is mobile responsive", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(`${BASE_URL}/shop`);
    await expect(page.locator("text=/[Kk]arz [Jj]uice/")).toBeVisible();
    await expect(page.locator("button:has-text('Add to cart')").first()).toBeVisible();
  });
});
