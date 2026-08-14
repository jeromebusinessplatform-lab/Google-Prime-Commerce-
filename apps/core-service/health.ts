import { validateAppEnvForRuntime } from "../../packages/config/env.js";

export function getRuntimeHealth(runtime: "server" | "worker") {
  const envHealth = validateAppEnvForRuntime(runtime, process.env as any, {
    strict: true,
  });
  const service =
    runtime === "worker" ? "prime-commerce-worker" : "prime-commerce-server";
  return {
    service,
    status: envHealth.ok ? "ready" : "config_error",
    ok: envHealth.ok,
    live: true,
    missing: envHealth.missing,
    dependencies:
      runtime === "worker"
        ? {
            db: Boolean((globalThis as any).__PRIME_D1_BINDING__),
            env: envHealth.ok,
          }
        : {
            api: true,
          },
  };
}

export function getDependencyHealth(runtime: "server" | "worker") {
  const health = getRuntimeHealth(runtime);
  const ready =
    runtime === "worker"
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
