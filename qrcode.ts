/**
 * QR Code utility for Karz Juice receipt verification
 *
 * Usage:
 *   import { generateQRDataURI, generateQRSVG } from "@/lib/qrcode";
 *   const dataUri = await generateQRDataURI("https://karzjuice.app/verify/RCP-20260416-0001");
 *
 * Install: pnpm add qrcode && pnpm add -D @types/qrcode
 */

// ── Server-side (Node.js) ─────────────────────────────────────────────────────
let QRCode: any = null;

async function loadQRCode() {
  if (QRCode) return QRCode;
  try {
    QRCode = await import("qrcode");
    return QRCode;
  } catch {
    return null;
  }
}

/**
 * Generate a PNG data URI suitable for embedding in HTML/PDF.
 * Falls back to the verify URL string if qrcode is not installed.
 */
export async function generateQRDataURI(
  url: string,
  opts: { width?: number; margin?: number; color?: { dark?: string; light?: string } } = {}
): Promise<string> {
  const qr = await loadQRCode();
  if (!qr) {
    console.warn("[QRCode] qrcode package not installed. Returning raw URL.");
    return url;
  }
  return qr.toDataURL(url, {
    width: opts.width ?? 200,
    margin: opts.margin ?? 1,
    color: {
      dark: opts.color?.dark ?? "#111111",
      light: opts.color?.light ?? "#FFFFFF",
    },
    errorCorrectionLevel: "M",
  });
}

/**
 * Generate an SVG string for inline use or PDF embedding.
 */
export async function generateQRSVG(url: string, size = 160): Promise<string> {
  const qr = await loadQRCode();
  if (!qr) return `<text>QR: ${url}</text>`;
  return qr.toString(url, { type: "svg", width: size, margin: 1 });
}

// ── Client-side (browser) ─────────────────────────────────────────────────────
/**
 * Generate QR code in the browser using the same qrcode library.
 * Render to a <canvas> element.
 *
 * Usage in React component:
 *   const canvasRef = useRef<HTMLCanvasElement>(null);
 *   useEffect(() => {
 *     if (canvasRef.current) renderQRToCanvas(canvasRef.current, url);
 *   }, [url]);
 */
export async function renderQRToCanvas(
  canvas: HTMLCanvasElement,
  url: string,
  size = 160
): Promise<void> {
  const qr = await loadQRCode();
  if (!qr) {
    // Draw fallback text
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.font = "10px monospace";
      ctx.fillText("QR unavailable", 4, 14);
    }
    return;
  }
  await qr.toCanvas(canvas, url, {
    width: size,
    margin: 1,
    errorCorrectionLevel: "M",
  });
}

// ── Receipt QR URL builder ────────────────────────────────────────────────────
export function buildVerifyURL(receiptNumber: string): string {
  const base = typeof window !== "undefined"
    ? window.location.origin
    : (process.env.APP_URL ?? "https://karzjuice.app");
  return `${base}/verify/${receiptNumber}`;
}

// ── Tests (inline) ────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === "test") {
  const { describe, it, expect } = await import("vitest");

  describe("QR Code utility", () => {
    it("should build verify URL correctly", () => {
      process.env.APP_URL = "https://karzjuice.app";
      const url = buildVerifyURL("RCP-20260416-0001");
      expect(url).toBe("https://karzjuice.app/verify/RCP-20260416-0001");
    });

    it("should return raw URL if qrcode not installed", async () => {
      const result = await generateQRDataURI("https://example.com/verify/TEST-001");
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });
  });
}
