// Cloudflare Workers entry point for the PRIME commerce stack.
//
// Responsibilities:
//   - wire the D1 binding into the data adapter (`packages/db-d1`)
//   - expose string bindings (vars/secrets) via `process.env` for the shared
//     Node-flavored service code
//   - route /api/* and /v1/* through the shared API route table
//   - serve static assets (storefront + admin SPAs) from the ASSETS binding
//     with per-SPA fallbacks

export interface Env {
  DB: any;
  ASSETS: any;
  [key: string]: unknown;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const g = globalThis as any;

    // Initialize Cloudflare bindings BEFORE importing shared service modules.
    // Those modules read configuration at module initialization, so importing
    // the router at top-level can snapshot an empty process.env on Workers.
    g.__PRIME_D1_BINDING__ = env.DB;

    if (typeof g.process !== "undefined" && g.process.env && typeof g.process.env === "object") {
      for (const key of Object.keys(env)) {
        const value = env[key];
        if (typeof value === "string") {
          g.process.env[key] = value;
        }
      }
    }

    const url = new URL(request.url);
    const isApi =
      url.pathname === "/api/health" ||
      url.pathname.startsWith("/api/") ||
      url.pathname.startsWith("/v1/");

    if (isApi) {
      // Deliberately load the router after Worker bindings/configuration have
      // been initialized. ES module imports are otherwise evaluated before
      // fetch() runs, which is too early for Cloudflare env bindings.
      const { handleApiRequest } = await import("./router.js");
      return handleApiRequest(request);
    }

    // Static assets (dist/ is uploaded to the ASSETS binding).
    const asset = await env.ASSETS.fetch(request);
    if (asset.status !== 404) return asset;

    // Vite emits the named HTML entrypoints as /storefront/index.html and
    // /admin/index.html. The fallback references the deployed dist asset
    // namespace rather than source-tree paths.
    const indexPath = url.pathname.startsWith("/admin")
      ? "/admin/index.html"
      : "/storefront/index.html";
    const fallback = await env.ASSETS.fetch(new URL(indexPath, request.url));
    if (fallback.status === 404) return fallback;
    return new Response(fallback.body, {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  },
};
