// Cloudflare Workers entry point for the PRIME commerce stack.
//
// The Worker hosts the complete production surface:
// - /v1/* and /api/* -> shared core-service handlers
// - /admin* -> Admin SPA assets
// - everything else -> Storefront SPA assets
// - D1 is the production persistence binding

export interface Env {
  DB: any;
  ASSETS: any;
  [key: string]: unknown;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const g = globalThis as any;

    // Cloudflare bindings are only available at request time. Shared service
    // modules read process.env during module initialization, so establish the
    // Worker environment before dynamically importing those modules.
    g.__PRIME_D1_BINDING__ = env.DB;

    if (!g.process || typeof g.process !== "object") {
      g.process = { env: {} };
    } else if (!g.process.env || typeof g.process.env !== "object") {
      g.process.env = {};
    }

    for (const key of Object.keys(env)) {
      const value = env[key];
      if (typeof value === "string") {
        g.process.env[key] = value;
      }
    }

    // Do not perform a blanket production-environment throw here. Cloudflare
    // Workers may legitimately serve static Shop/Admin assets while optional
    // integrations are not configured. The previous blanket validation caused
    // every request to become Error 1101 when a non-asset secret was absent.
    // API health endpoints report missing runtime configuration explicitly.
    const [{ handleApiRequest }] = await Promise.all([import("./router.js")]);

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

    // SPA routing: Serve appropriate index.html for unknown paths.
    // Use the dist folder structure directly.
    const indexPath = url.pathname.startsWith("/admin")
      ? "/apps/admin/src/index.html"
      : "/apps/storefront/src/index.html";

    return await env.ASSETS.fetch(new Request(new URL(indexPath, request.url), request));
  },
};
