import { z } from "zod";
import crypto from "crypto";

const isDev = process.env.NODE_ENV !== "production" && process.env.APP_ENV !== "production";
const isWorkerRuntime = typeof (globalThis as any).WebSocketPair !== "undefined";

const envSchema = z.object({
  APP_ENV: z.string().default("development"),
  PORT: z.string().default("3000"),
  
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_BOT_ID: z.string().optional(),
  TELEGRAM_WEBHOOK_SECRET: z.string().optional(),
  TELEGRAM_AUTH_MAX_AGE_SECONDS: z.coerce.number().default(300),
  
  BOOTSTRAP_OWNER_TELEGRAM_ID: z.string().optional(),
  ADMIN_BOOTSTRAP_CODE: z.string().default("COREADMIN1991"),
  ADMIN_ACCESS_CODE: z.string().optional(),
  ADMIN_CODE_PEPPER: z.string().optional(),
  
  SESSION_SIGNING_KEY_CURRENT: z.string().optional(),
  SESSION_SIGNING_KEY_PREVIOUS: z.string().optional(),
  
  FIELD_ENCRYPTION_KEY_CURRENT: z.string().optional(),
  FIELD_ENCRYPTION_KEY_PREVIOUS: z.string().optional(),
  
  RECEIPT_ANALYZER_PROVIDER: z.string().optional(),
  RECEIPT_ANALYZER_API_KEY: z.string().optional(),
  RECEIPT_OCR_API: z.string().optional(),
  RECEIPT_SCREENING_MAX_WAIT_SECONDS: z.coerce.number().default(30),
  
  GEOAPIFY_API_KEY: z.string().optional(),
  PUBLIC_GEOAPIFY_MAP_KEY: z.string().optional(),
  
  PAYMENT_GATEWAY_PROVIDER: z.string().optional(),
  PAYMENT_GATEWAY_API_KEY: z.string().optional(),
  PAYMENT_GATEWAY_WEBHOOK_SECRET: z.string().optional(),
  
  ERROR_REPORTING_DSN: z.string().optional(),
});

const parsed = envSchema.parse(process.env);

function validateRequiredInProduction(name: string, value: unknown) {
  if (!isWorkerRuntime && !value) {
    throw new Error(`${name} is required in production`);
  }
}

// Fallbacks for dev mode (Preview Mode)
if (isDev && !isWorkerRuntime) {
  parsed.SESSION_SIGNING_KEY_CURRENT = parsed.SESSION_SIGNING_KEY_CURRENT || crypto.randomBytes(32).toString("hex");
  parsed.FIELD_ENCRYPTION_KEY_CURRENT = parsed.FIELD_ENCRYPTION_KEY_CURRENT || crypto.randomBytes(32).toString("hex");
  parsed.ADMIN_CODE_PEPPER = parsed.ADMIN_CODE_PEPPER || crypto.randomBytes(32).toString("hex");
} else if (!isWorkerRuntime) {
  // Enforce required values in production
  validateRequiredInProduction("SESSION_SIGNING_KEY_CURRENT", parsed.SESSION_SIGNING_KEY_CURRENT);
  validateRequiredInProduction("FIELD_ENCRYPTION_KEY_CURRENT", parsed.FIELD_ENCRYPTION_KEY_CURRENT);
  validateRequiredInProduction("ADMIN_CODE_PEPPER", parsed.ADMIN_CODE_PEPPER);
  // Third party integrations may be optional if feature flags dictate it, but keeping it flexible.
}

export const env = {
  ...parsed,
  IS_PREVIEW: isDev,
};

type RuntimeTarget = "worker" | "server";

const runtimeRequiredVars: Record<RuntimeTarget, string[]> = {
  server: [
    "SESSION_SIGNING_KEY_CURRENT",
    "FIELD_ENCRYPTION_KEY_CURRENT",
    "ADMIN_CODE_PEPPER",
  ],
  worker: [
    "SESSION_SIGNING_KEY_CURRENT",
    "FIELD_ENCRYPTION_KEY_CURRENT",
    "ADMIN_CODE_PEPPER",
    "TELEGRAM_BOT_TOKEN",
    "TELEGRAM_WEBHOOK_SECRET",
  ],
};

export function validateAppEnvForRuntime(
  runtime: RuntimeTarget = "server",
  values: Record<string, unknown> = parsed as Record<string, unknown>,
  options: { strict?: boolean } = {}
) {
  const missing: string[] = [];
  const strict = options.strict ?? !isDev;
  if (strict) {
    for (const name of runtimeRequiredVars[runtime]) {
      const value = values[name];
      if (!value || String(value).trim() === "") missing.push(name);
    }
  }

  return {
    ok: missing.length === 0,
    missing,
  };
}

export function validateAppEnvOrThrow(runtime: RuntimeTarget = "server") {
  const health = validateAppEnvForRuntime(runtime);
  if (!health.ok) {
    throw new Error(
      `${runtime} runtime missing required environment variables: ${health.missing.join(", ")}`
    );
  }
  return health;
}
