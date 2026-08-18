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

  it("marks server readiness as config_error when required env is missing", () => {
    process.env.SESSION_SIGNING_KEY_CURRENT = "";
    process.env.FIELD_ENCRYPTION_KEY_CURRENT = "";
    process.env.ADMIN_CODE_PEPPER = "";

    const health = getRuntimeHealth("server");
    expect(health).toMatchObject({
      status: "config_error",
      ok: false,
      missing: expect.arrayContaining([
        "SESSION_SIGNING_KEY_CURRENT",
        "FIELD_ENCRYPTION_KEY_CURRENT",
        "ADMIN_CODE_PEPPER",
      ]),
    });
  });

  it("marks worker dependency health as dependency_error when DB binding is missing", () => {
    delete (globalThis as any).__PRIME_D1_BINDING__;
    const health = getDependencyHealth("worker");
    expect(health).toMatchObject({
      status: "dependency_error",
      ok: false,
      dependencies: { db: false, env: true },
    });
  });
});
