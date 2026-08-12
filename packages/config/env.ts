import { z } from "zod";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const isDev = process.env.NODE_ENV !== "production" && process.env.APP_ENV !== "production";

const envSchema = z.object({
  APP_ENV: z.string().default("development"),
  PORT: z.string().default("3000"),
  
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_BOT_ID: z.string().optional(),
  TELEGRAM_WEBHOOK_SECRET: z.string().optional(),
  TELEGRAM_AUTH_MAX_AGE_SECONDS: z.coerce.number().default(300),
  
  BOOTSTRAP_OWNER_TELEGRAM_ID: z.string().optional(),
  ADMIN_BOOTSTRAP_CODE: z.string().default("COREADMIN1991"),
  ADMIN_CODE_PEPPER: z.string().optional(),
  
  SESSION_SIGNING_KEY_CURRENT: z.string().optional(),
  SESSION_SIGNING_KEY_PREVIOUS: z.string().optional(),
  
  FIELD_ENCRYPTION_KEY_CURRENT: z.string().optional(),
  FIELD_ENCRYPTION_KEY_PREVIOUS: z.string().optional(),
  
  RECEIPT_ANALYZER_PROVIDER: z.string().optional(),
  RECEIPT_ANALYZER_API_KEY: z.string().optional(),
  RECEIPT_SCREENING_MAX_WAIT_SECONDS: z.coerce.number().default(30),
  
  GEOAPIFY_API_KEY: z.string().optional(),
  PUBLIC_GEOAPIFY_MAP_KEY: z.string().optional(),
  
  PAYMENT_GATEWAY_PROVIDER: z.string().optional(),
  PAYMENT_GATEWAY_API_KEY: z.string().optional(),
  PAYMENT_GATEWAY_WEBHOOK_SECRET: z.string().optional(),
  
  ERROR_REPORTING_DSN: z.string().optional(),
});

const parsed = envSchema.parse(process.env);

// Fallbacks for dev mode (Preview Mode)
if (isDev) {
  parsed.SESSION_SIGNING_KEY_CURRENT = parsed.SESSION_SIGNING_KEY_CURRENT || crypto.randomBytes(32).toString("hex");
  parsed.FIELD_ENCRYPTION_KEY_CURRENT = parsed.FIELD_ENCRYPTION_KEY_CURRENT || crypto.randomBytes(32).toString("hex");
  parsed.ADMIN_CODE_PEPPER = parsed.ADMIN_CODE_PEPPER || crypto.randomBytes(32).toString("hex");
} else {
  // Enforce required values in production
  if (!parsed.SESSION_SIGNING_KEY_CURRENT) throw new Error("SESSION_SIGNING_KEY_CURRENT is required in production");
  if (!parsed.FIELD_ENCRYPTION_KEY_CURRENT) throw new Error("FIELD_ENCRYPTION_KEY_CURRENT is required in production");
  if (!parsed.ADMIN_CODE_PEPPER) throw new Error("ADMIN_CODE_PEPPER is required in production");
  // Third party integrations may be optional if feature flags dictate it, but keeping it flexible.
}

export const env = {
  ...parsed,
  IS_PREVIEW: isDev,
};
