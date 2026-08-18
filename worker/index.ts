// Cloudflare Workers entry point for the PRIME commerce stack.

import { handleApiRequest } from "./router.js";

export interface Env {
  DB: any;
  ASSETS: any;
  [key: string]: unknown;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const g = globalThis as any;
    
    // The db adapter reads this on its first operation (lazy driver).
    console.log("DEBUG: env.DB exists:", !!env.DB);
    g.__PRIME_D1_BINDING__ = env.DB;

    const url = new URL(request.url);
    const pathname = url.pathname.toLowerCase();

    // API Routes
    if (pathname.startsWith("/api/") || pathname.startsWith("/v1/")) {
      return handleApiRequest(request);
    }

    // Static assets - try fetching the request as-is
    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status !== 404) {
      if (assetResponse.status === 307 || assetResponse.status === 301) {
          // Fall through to SPA handling
      } else {
        return assetResponse;
      }
    }

    // SPA fallback: Determine the correct index.html
    const indexPath = (pathname === "/admin" || pathname.startsWith("/admin/"))
      ? "/apps/admin/src/index.html"
      : "/apps/storefront/src/index.html";

    // Return the index.html file directly
    return await env.ASSETS.fetch(new Request(new URL(indexPath, request.url)));
  },
};
