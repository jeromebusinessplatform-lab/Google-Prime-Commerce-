import { describe, it, expect, beforeEach } from "vitest";
import { getDependencyHealth, getRuntimeHealth } from "./health.js";

beforeEach(() => {
  process.env.NODE_ENV = "test";
  process.env.APP_ENV = "development";
  process.env.SESSION_SIGNING_KEY_CURRENT = "server-signing";
  process.env.FIELD_ENCRYPTION_KEY_CURRENT = "server-encryption";
  process.env.ADMIN_CODE_PEPPER = "pepper";
  process.env.TELEGRAM_BOT_TOKEN = "bot-token";
  process.env.TELEGRAM_WEBHOOK_SECRET = "webhook-secret";
});

describe("shared runtime health", () => {
  it("reports server readiness with api dependency metadata", () => {
    const health = getRuntimeHealth("server");
    expect(health).toMatchObject({
      service: "prime-commerce-server",
      live: true,
      dependencies: { api: true },
    });
  });

  it("reports worker dependency readiness with db/env metadata", () => {
    const health = getDependencyHealth("worker");
    expect(health).toMatchObject({
      service: "prime-commerce-worker",
      dependencies: { db: false, env: true },
      ok: false,
    });
  });
});
