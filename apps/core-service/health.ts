import { validateAppEnvForRuntime } from "../../packages/config/env.js";

export function getRuntimeHealth(runtime: "server" | "worker", values?: Record<string, unknown>) {
  const envHealth = validateAppEnvForRuntime(runtime, values);
  const service = runtime === "worker" ? "prime-commerce-worker" : "prime-commerce-server";

  const db = Boolean((globalThis as any).__PRIME_D1_BINDING__);
  const env = envHealth.ok;

  let status = "ready";
  const errors: string[] = [];

  if (!env) {
    status = "config_error";
    errors.push("Missing required environment variables");
  }

  if (runtime === "worker" && !db) {
    status = "dependency_error";
    errors.push("Database binding missing");
  }

  return {
    service,
    status,
    ok: status === "ready",
    errors,
    live: true,
    missing: envHealth.missing,
    dependencies:
      runtime === "worker"
        ? {
            db,
            env,
          }
        : { api: true },
  };
}

export function getDependencyHealth(runtime: "server" | "worker", values?: Record<string, unknown>) {
  const health = getRuntimeHealth(runtime, values);
  const ready = runtime === "worker"
    ? Boolean(health.dependencies.db && health.dependencies.env)
    : Boolean(health.dependencies.api && health.ok);
  return {
    service: health.service,
    status: ready ? "ready" : "dependency_error",
    ok: ready,
    dependencies: health.dependencies,
    missing: health.missing,
  };
}
