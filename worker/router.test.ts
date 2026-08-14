import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../apps/core-service/routes.js", () => ({
  apiRoutes: [],
}));

beforeEach(() => {
  process.env.NODE_ENV = "test";
  process.env.APP_ENV = "development";
  process.env.SESSION_SIGNING_KEY_CURRENT = "server-signing";
  process.env.FIELD_ENCRYPTION_KEY_CURRENT = "server-encryption";
  process.env.ADMIN_CODE_PEPPER = "pepper";
  process.env.TELEGRAM_BOT_TOKEN = "bot-token";
  process.env.TELEGRAM_WEBHOOK_SECRET = "webhook-secret";
});

describe("worker health routes", () => {
  it("exposes live, ready, and dependencies endpoints", async () => {
    const { handleApiRequest } = await import("./router.js");

    const live = await handleApiRequest(new Request("http://example.com/api/health/live"));
    expect(live.status).toBe(200);
    expect(await live.json()).toMatchObject({ status: "live", ok: true });

    const ready = await handleApiRequest(new Request("http://example.com/api/health/ready"));
    expect(ready.status).toBe(200);
    expect(await ready.json()).toMatchObject({ ok: true, dependencies: { db: false, env: true } });

    const deps = await handleApiRequest(new Request("http://example.com/api/health/dependencies"));
    expect(deps.status).toBe(503);
    expect(await deps.json()).toMatchObject({ ok: false, dependencies: { db: false, env: true } });
  });
});
