// Data access facade switch.
//
// The rest of the codebase imports `db` from this module and relies on the
// Firestore-like API (collection/doc/get/set/update/where/orderBy/limit,
// batch, runTransaction, FieldValue.increment).
//
// Two backends expose that exact API:
//   - ./firestore.ts -> Google Firestore (original backend)
//   - ../db-d1/      -> D1 / SQLite (Cloudflare migration target)
//
// The backend is selected synchronously at import time:
//   - `DB_DRIVER=d1` env var -> local Node/Express runs against SQLite
//   - otherwise the Firestore facade is used for local preview mode
//
// On Cloudflare, the Worker bundle aliases this module to `packages/db-d1`
// directly (see scripts/build-worker.mjs), so the Firestore facade never
// ships to Cloudflare.
//
// Both modules are imported statically (keeps the CJS server bundle happy);
// the Firestore facade is a no-op cost in local D1 mode and never ships in
// the Cloudflare Worker bundle.

import * as firestore from "./firestore.js";

const useD1 =
  typeof process !== "undefined" && process.env?.DB_DRIVER === "d1";

const d1Promise = useD1 ? import("../db-d1/index.js") : null;

async function getD1Module() {
  if (!d1Promise) throw new Error("D1 adapter is not enabled");
  return await d1Promise;
}

export const db: any = useD1
  ? new Proxy({}, {
      get(_target, prop) {
        return async (...args: any[]) => {
          const mod = await getD1Module();
          const value = (mod.db as any)[prop];
          if (typeof value === "function") return value.apply(mod.db, args);
          return value;
        };
      },
    })
  : firestore.db;
export const storage = null;
export const firestoreDb = useD1 ? null : firestore.firestoreDb;
