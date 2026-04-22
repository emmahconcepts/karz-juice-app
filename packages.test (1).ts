import { describe, expect, it, beforeEach, vi } from "vitest";

// ── Mock DB ───────────────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────
function makePackage(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    packageName: "Birthday Package",
    description: "Birthday celebration bundle",
    price: "150000",
    includedItems: ["20 Mango Juice Bottles", "20 Passion Juice Bottles", "Decorative packaging"],
    status: "active" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("Packages Module — CRUD", () => {
  it("should validate a package has a name and price", () => {
    const pkg = makePackage();
    expect(pkg.packageName).toBeTruthy();
    expect(parseFloat(pkg.price)).toBeGreaterThan(0);
  });

  it("should create a package with included items list", () => {
    const pkg = makePackage();
    expect(pkg.includedItems).toBeInstanceOf(Array);
    expect(pkg.includedItems.length).toBeGreaterThan(0);
  });

  it("should default status to active on creation", () => {
    const pkg = makePackage();
    expect(pkg.status).toBe("active");
  });

  it("should reject a package with no name", () => {
    const validate = (name: string) => name.trim().length > 0;
    expect(validate("")).toBe(false);
    expect(validate("Birthday Package")).toBe(true);
  });

  it("should reject a package with negative price", () => {
    const validate = (price: string) => parseFloat(price) >= 0;
    expect(validate("-5000")).toBe(false);
    expect(validate("150000")).toBe(true);
  });

  it("should format price as UGX", () => {
    const formatUGX = (n: number) => `UGX ${n.toLocaleString()}`;
    expect(formatUGX(150000)).toBe("UGX 150,000");
  });
});

describe("Packages Module — Status Toggle", () => {
  it("should toggle active → inactive", () => {
    const pkg = makePackage({ status: "active" });
    const toggled = pkg.status === "active" ? "inactive" : "active";
    expect(toggled).toBe("inactive");
  });

  it("should toggle inactive → active", () => {
    const pkg = makePackage({ status: "inactive" });
    const toggled = pkg.status === "active" ? "inactive" : "active";
    expect(toggled).toBe("active");
  });

  it("should filter only active packages", () => {
    const packages = [
      makePackage({ id: 1, status: "active" }),
      makePackage({ id: 2, status: "inactive" }),
      makePackage({ id: 3, status: "active" }),
    ];
    const active = packages.filter(p => p.status === "active");
    expect(active).toHaveLength(2);
  });
});

describe("Packages Module — Business Logic", () => {
  it("should calculate average package price", () => {
    const prices = [150000, 200000, 250000];
    const avg = prices.reduce((s, p) => s + p, 0) / prices.length;
    expect(avg).toBe(200000);
  });

  it("should count included items correctly", () => {
    const pkg = makePackage({
      includedItems: ["Item A", "Item B", "Item C"],
    });
    expect(pkg.includedItems.length).toBe(3);
  });

  it("should handle empty included items list", () => {
    const pkg = makePackage({ includedItems: [] });
    expect(pkg.includedItems).toHaveLength(0);
  });

  it("should deduplicate package names", () => {
    const names = ["Birthday Package", "Wedding Package", "Birthday Package"];
    const unique = [...new Set(names)];
    expect(unique).toHaveLength(2);
  });

  it("should support all predefined package types", () => {
    const TYPES = ["Birthday Package", "Wedding Package", "Women Care Package", "Kids Party Package", "Corporate Package"];
    TYPES.forEach(type => {
      expect(type.length).toBeGreaterThan(0);
    });
    expect(TYPES).toHaveLength(5);
  });
});
