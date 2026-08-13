import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    environment: "node",
    // Run the whole suite against the D1/SQLite backend (in-memory) instead of
    // live Firestore so tests are hermetic and exercise the Cloudflare path.
    env: {
      DB_DRIVER: "d1",
      DB_PATH: ":memory:",
    },
  },
});
