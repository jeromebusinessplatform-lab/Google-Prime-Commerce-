// Cloudflare Worker fetch router for the API surface.
//
// Express-style handlers (req/res) are invoked through a minimal adapter so
// the exact same `apps/core-service/*` handlers and the shared route table
// from `apps/core-service/routes.ts` work unmodified on Workers.

import { apiRoutes } from "../apps/core-service/routes.js";

interface CompiledRoute {
  method: string;
  path: string;
  handler: ((req: any, res: any) => Promise<any> | any) | undefined;
  regex: RegExp;
  keys: string[];
}

function compileRoute(method: string, pattern: string): Omit<CompiledRoute, "path" | "handler"> {
  const keys: string[] = [];
  const regex = new RegExp(
    "^" +
      pattern.replace(/:[A-Za-z0-9_]+/g, (m) => {
        keys.push(m.slice(1));
        return "([^/]+)";
      }) +
      "$"
  );
  return { method, regex, keys };
}

const compiled: CompiledRoute[] = apiRoutes.map((route) => ({
  method: route.method,
  path: route.path,
  handler: route.handler,
  ...compileRoute(route.method, route.path),
}));

class WorkerResponse {
  statusCode = 200;
  headers = new Headers();
  private body: string | undefined;

  status(code: number) {
    this.statusCode = code;
    return this;
  }

  set(name: string, value: string) {
    this.headers.set(name, value);
    return this;
  }

  setHeader(name: string, value: string) {
    this.headers.set(name, value);
  }

  json(data: any) {
    return this.send(data);
  }

  send(data: any) {
    if (data === undefined || data === null) {
      this.body = "";
    } else if (typeof data === "string") {
      if (!this.headers.has("content-type")) {
        this.headers.set("content-type", "text/plain; charset=utf-8");
      }
      this.body = data;
    } else {
      if (!this.headers.has("content-type")) {
        this.headers.set("content-type", "application/json; charset=utf-8");
      }
      this.body = JSON.stringify(data);
    }
    return this;
  }

  end(data?: any) {
    if (data !== undefined) this.send(data);
    return this;
  }

  toResponse(): Response {
    return new Response(this.body ?? "", {
      status: this.statusCode,
      headers: this.headers,
    });
  }
}

async function readBody(request: Request): Promise<any> {
  const text = await request.text();
  if (!text) return undefined;
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams(text);
    const out: Record<string, any> = {};
    params.forEach((value, key) => {
      out[key] = value;
    });
    return out;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export async function handleApiRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method.toLowerCase();
  const pathname = url.pathname;

  if (method === "get" && pathname === "/api/health") {
    return json({ status: "ok" });
  }

  for (const route of compiled) {
    if (route.method !== method) continue;
    const match = pathname.match(route.regex);
    if (!match) continue;

    if (typeof route.handler !== "function") {
      return json(
        { error: { message: "Handler not implemented", code: "NOT_IMPLEMENTED" } },
        501
      );
    }

    const params: Record<string, string> = {};
    route.keys.forEach((key, index) => {
      params[key] = match[index + 1];
    });

    const req: any = {
      method: request.method,
      url: request.url,
      originalUrl: pathname + url.search,
      path: pathname,
      params,
      query: Object.fromEntries(url.searchParams.entries()),
      headers: Object.fromEntries(request.headers.entries()),
      body: ["get", "delete"].includes(method) ? undefined : (await readBody(request)) ?? {},
    };

    const res = new WorkerResponse();
    try {
      await route.handler(req, res);
    } catch (err) {
      console.error("Worker API error:", err);
      return json(
        {
          error: {
            message: "Internal Server Error",
            code: "UNKNOWN_ERROR",
            requestId: req.headers["x-request-id"] || "req-" + Date.now(),
          },
        },
        500
      );
    }
    return res.toResponse();
  }

  return json({ error: "Not Found" }, 404);
}
