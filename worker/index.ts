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
    const path = url.pathname;

    // 1. Handle API requests
    const isApi =
      path === "/api/health" ||
      path.startsWith("/api/") ||
      path.startsWith("/v1/");

    if (isApi) {
      return handleApiRequest(request);
    }

    // 2. Handle Static Assets directly from root
    // This ensures /assets/... is always found regardless of the current URL path.
    if (path.includes("/assets/")) {
      const assetPath = "/assets/" + path.split("/assets/").pop();
      return await env.ASSETS.fetch(new Request(new URL(assetPath, request.url), request));
    }

    // 3. Try to serve exact file matches (favicon, images, etc.)
    const directAsset = await env.ASSETS.fetch(request);
    if (directAsset.status === 200) {
      return directAsset;
    }

    // 4. SPA Fallback Routing
    // Serve the bundled index.html file path.
    const isAdmin = path === "/admin" || path.startsWith("/admin/");
    const indexPath = isAdmin ? "/admin/index.html" : "/index.html";
    
    const spaResponse = await env.ASSETS.fetch(new Request(new URL(indexPath, request.url)));
    
    if (spaResponse.status === 200) {
      // Return a fresh response with the same body but fixed headers to avoid any browser-side 
      // confusion or redirects.
      const headers = new Headers(spaResponse.headers);
      headers.set("Content-Type", "text/html; charset=utf-8");
      headers.set("Cache-Control", "no-cache");
      
      return new Response(spaResponse.body, {
        status: 200,
        headers
      });
    }

    return spaResponse; // Fallback to whatever error Cloudflare gives (usually 404)
  },
};
