import { describe, it, expect, beforeEach, afterEach } from "vitest";

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env.NODE_ENV = "test";
  process.env.APP_ENV = "development";
  process.env.SESSION_SIGNING_KEY_CURRENT = "";
  process.env.FIELD_ENCRYPTION_KEY_CURRENT = "";
  process.env.ADMIN_CODE_PEPPER = "";
  process.env.TELEGRAM_BOT_TOKEN = "";
  process.env.TELEGRAM_WEBHOOK_SECRET = "";
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("runtime env validation", () => {
  it("reports missing server variables", async () => {
    const { validateAppEnvForRuntime } = await import("./env.js");
    const health = validateAppEnvForRuntime("server", {}, { strict: true });

    expect(health.ok).toBe(false);
    expect(health.missing).toEqual([
      "SESSION_SIGNING_KEY_CURRENT",
      "FIELD_ENCRYPTION_KEY_CURRENT",
      "ADMIN_CODE_PEPPER",
    ]);
  });

  it("reports missing worker variables", async () => {
    const { validateAppEnvForRuntime } = await import("./env.js");
    const health = validateAppEnvForRuntime("worker", {}, { strict: true });

    expect(health.ok).toBe(false);
    expect(health.missing).toEqual([
      "SESSION_SIGNING_KEY_CURRENT",
      "FIELD_ENCRYPTION_KEY_CURRENT",
      "ADMIN_CODE_PEPPER",
      "TELEGRAM_BOT_TOKEN",
      "TELEGRAM_WEBHOOK_SECRET",
    ]);
  });
});
