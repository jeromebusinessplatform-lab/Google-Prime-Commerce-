// Cloudflare Workers entry point for the PRIME commerce stack.
//
// Responsibilities:
//   - wire the D1 binding into the data adapter (`packages/db-d1`)
//   - expose string bindings (vars/secrets) via `process.env` for the shared
//     Node-flavored service code
//   - route /api/* and /v1/* through the shared API route table
//   - serve static assets (storefront + admin SPAs) from the ASSETS binding
//     with per-SPA fallbacks

import { handleApiRequest } from "./router.js";

export interface Env {
  DB: any;
  ASSETS: any;
  import { handleApiRequest } from "./router.js";
  import { validateAppEnvOrThrow } from "../packages/config/env.js";

  export interface Env {
  ...
    async fetch(request: Request, env: Env): Promise<Response> {
      const g = globalThis as any;

      // The db adapter reads this on its first operation (lazy driver).
      g.__PRIME_D1_BINDING__ = env.DB;

      // Shared service code reads config from process.env (env.ts, telegram.ts,
      // geoapify.ts). Copy vars and secrets into it so the same code runs on
      // Workers without changes.
      if (typeof g.process !== "undefined" && g.process.env && typeof g.process.env === "object") {
        for (const key of Object.keys(env)) {
          const value = env[key];
          if (typeof value === "string" && !(key in g.process.env)) {
            g.process.env[key] = value;
          }
        }
      }

      validateAppEnvOrThrow("worker");

      const url = new URL(request.url);
    const isApi =
      url.pathname === "/api/health" ||
      url.pathname.startsWith("/api/") ||
      url.pathname.startsWith("/v1/");
    if (isApi) return handleApiRequest(request);

    // Static assets (dist/ is uploaded to the ASSETS binding).
    const asset = await env.ASSETS.fetch(request);
    if (asset.status !== 404) return asset;

    // SPA fallback: /admin* -> admin bundle, everything else -> storefront.
    const indexPath = url.pathname.startsWith("/admin")
      ? "/apps/admin/src/index.html"
      : "/apps/storefront/src/index.html";
    const fallback = await env.ASSETS.fetch(new URL(indexPath, request.url));
    if (fallback.status === 404) return fallback;
    return new Response(fallback.body, {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  },
};
