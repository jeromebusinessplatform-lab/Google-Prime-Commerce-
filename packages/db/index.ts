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
import * as d1 from "../db-d1/index.js";

const useD1 =
  typeof process !== "undefined" && process.env?.DB_DRIVER === "d1";

export const db = useD1 ? d1.db : firestore.db;
export const storage = null;
export const firestoreDb = useD1 ? null : firestore.firestoreDb;
