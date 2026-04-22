import express, { type Express, type Request, type Response, type NextFunction } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  // Middleware to intercept /shop route before Vite middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log("[VITE] Request path:", req.path, "URL:", req.url);
    if (req.path === "/shop" || req.url.startsWith("/shop")) {
      console.log("[SHOP] Intercepting /shop route");
      handleShopPage(req, res, vite).catch((e) => {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      });
    } else {
      next();
    }
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

async function handleShopPage(req: Request, res: Response, vite: any) {
  const url = req.originalUrl;
  const clientTemplate = path.resolve(
    import.meta.dirname,
    "../..",
    "client",
    "index.html"
  );
  let template = await fs.promises.readFile(clientTemplate, "utf-8");
  // Inject a global variable to indicate this is a shop page
  template = template.replace(
    `<body>`,
    `<body><script>window.__MANUS_SHOP_PAGE__ = true;</script>`
  );
  template = template.replace(
    `src="/src/main.tsx"`,
    `src="/src/main.tsx?v=${nanoid()}"`
  );
  const page = await vite.transformIndexHtml(url, template);
  res.status(200).set({ "Content-Type": "text/html" }).end(page);
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
