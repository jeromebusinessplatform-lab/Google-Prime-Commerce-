// Cloudflare Workers entry point for the PRIME commerce stack.
//
// The Worker hosts the complete production surface:
// - /v1/* and /api/* -> shared core-service handlers
// - /admin* -> Admin SPA assets
// - everything else -> Storefront SPA assets
// - D1 is the production persistence binding

import { handleApiRequest } from "./router.js";
import { validateAppEnvOrThrow } from "../packages/config/env.js";

export interface Env {
  DB: any;
  ASSETS: any;
  [key: string]: unknown;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const g = globalThis as any;

    // The D1 adapter reads this lazily on its first database operation.
    g.__PRIME_D1_BINDING__ = env.DB;

    // Shared Node-flavoured service modules read process.env. Mirror Worker
    // vars/secrets into it without overwriting an explicitly populated value.
    if (
      typeof g.process !== "undefined" &&
      g.process?.env &&
      typeof g.process.env === "object"
    ) {
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

    if (isApi) {
      return handleApiRequest(request);
    }

    // Workers Static Assets serves the built storefront and admin bundles.
    const asset = await env.ASSETS.fetch(request);
    if (asset.status !== 404) {
      return asset;
    }

    // Vite's multi-page build preserves the source HTML directory structure.
    // Resolve the built SPA entry from both the conventional root location and
    // the repository's actual source-entry output location. This keeps the
    // Cloudflare Worker independent of Vite's HTML output layout.
    const candidates = url.pathname.startsWith("/admin")
      ? ["/admin/index.html", "/apps/admin/src/index.html"]
      : ["/index.html", "/apps/storefront/src/index.html"];

    for (const indexPath of candidates) {
      const fallback = await env.ASSETS.fetch(
        new Request(new URL(indexPath, request.url), request)
      );
      if (fallback.status !== 404) {
        return new Response(fallback.body, {
          status: 200,
          headers: new Headers({ "content-type": "text/html; charset=utf-8" }),
        });
      }
    }

    return new Response("Not Found", { status: 404 });
  },
};
