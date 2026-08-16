import express from "express";
import path from "path";
import fs from "fs/promises";
import { createServer as createViteServer } from "vite";
import { registerApiRoutes } from "./apps/core-service/routes.js";
import { validateAppEnvOrThrow } from "./packages/config/env.js";
import { getDependencyHealth, getRuntimeHealth } from "./apps/core-service/health.js";

async function startServer() {
  if (typeof process.loadEnvFile === "function") {
    try {
      process.loadEnvFile();
    } catch {}
  }
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  validateAppEnvOrThrow("server");

  // Add JSON parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // API Routes
  app.get("/api/health", (req, res) => {
    const runtimeHealth = getRuntimeHealth("server");
    res.status(runtimeHealth.ok ? 200 : 503).json({
      ...runtimeHealth,
    });
  });

  app.get("/api/health/live", (req, res) => {
    res.json({ service: "prime-commerce-server", status: "live", ok: true });
  });

  app.get("/api/health/ready", (req, res) => {
    const runtimeHealth = getRuntimeHealth("server");
    res.status(runtimeHealth.ok ? 200 : 503).json({
      ...runtimeHealth,
    });
  });

  app.get("/api/health/dependencies", (req, res) => {
    const dependencyHealth = getDependencyHealth("server");
    res.status(dependencyHealth.ok ? 200 : 503).json(dependencyHealth);
  });

  // All /v1/* endpoints come from the shared route table
  // (single source of truth shared with the Cloudflare Worker).
  registerApiRoutes(app);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
    app.use(vite.middlewares);
    
    app.use('/admin', async (req, res, next) => {
      try {
        const url = req.originalUrl;
        let template = await fs.readFile(path.resolve(process.cwd(), 'apps/admin/src/index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });

    app.use('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/v1')) return next();
      try {
        const url = req.originalUrl;
        let template = await fs.readFile(path.resolve(process.cwd(), 'apps/storefront/src/index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });

  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('/admin*', (req, res) => {
      res.sendFile(path.join(distPath, 'apps/admin/src/index.html'));
    });
    app.get('*', (req, res) => {
      if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/v1')) return res.status(404).end();
      res.sendFile(path.join(distPath, 'apps/storefront/src/index.html'));
    });
  }

  app.use(async (err: any, req: any, res: any, next: any) => {
    const { errorHandler } = await import("./apps/core-service/error-handler.js");
    errorHandler(err, req, res, next);
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
