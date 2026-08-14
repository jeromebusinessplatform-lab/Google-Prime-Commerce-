import { beforeEach, describe, expect, it, vi } from "vitest";

const add = vi.fn(async () => ({ id: "op-1" }));
const get = vi.fn(async () => ({ empty: true, docs: [] }));
const limit = vi.fn(() => ({ get }));
const where = vi.fn(() => ({ limit }));
const collection = vi.fn(() => ({ where, add }));

vi.mock("../../packages/db/index.js", () => ({
  db: {
    collection,
    FieldValue: {
      increment: vi.fn(),
    },
  },
}));

beforeEach(() => {
  process.env.NODE_ENV = "test";
  process.env.APP_ENV = "development";
  process.env.ADMIN_ACCESS_CODE = "BROWSER-ACCESS";
  process.env.ADMIN_BOOTSTRAP_CODE = "COREADMIN1991";
  process.env.ADMIN_CODE_PEPPER = "pepper";
  process.env.SESSION_SIGNING_KEY_CURRENT = "session";
  process.env.FIELD_ENCRYPTION_KEY_CURRENT = "field";
  process.env.TELEGRAM_BOT_TOKEN = "token";
  process.env.TELEGRAM_WEBHOOK_SECRET = "secret";
});

describe("admin login", () => {
  it("accepts the browser access code and creates an admin session", async () => {
    const { adminLoginHandler } = await import("./auth.js");

    const cookie = vi.fn();
    const status = vi.fn(function (this: any) {
      return this;
    });
    const json = vi.fn();

    const req: any = {
      body: {
        tenantId: "default",
        accessCode: "browser-access",
        initData: "PREVIEW_MOCK",
      },
    };
    const res: any = {
      cookie,
      status,
      json,
    };

    await adminLoginHandler(req, res);

    expect(collection).toHaveBeenCalledWith("tenants/default/operators");
    expect(add).toHaveBeenCalled();
    expect(cookie).toHaveBeenCalledWith(
      "admin_session",
      expect.any(String),
      expect.objectContaining({ httpOnly: true, sameSite: "strict" })
    );
    expect(json).toHaveBeenCalledWith({ success: true });
  });
});
