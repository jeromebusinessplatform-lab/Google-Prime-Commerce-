// Bundles the Cloudflare Worker with esbuild.
//
// `packages/db` (the Firestore facade) is aliased to `packages/db-d1` (the
// D1/SQLite adapter) so the Worker bundle never contains the Firebase client
// or Node-only file-system code. Node builtins stay external and are resolved
// at runtime through `nodejs_compat`.
import esbuild from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dbD1Entry = path.resolve(root, "packages/db-d1/index.ts");
const outfile = path.resolve(root, "dist-worker/index.js");

const dbAliasPlugin = {
  name: "prime-db-alias",
  setup(build) {
    build.onResolve({ filter: /.*/ }, (args) => {
      if (args.path.endsWith("packages/db/index.js")) {
        return { path: dbD1Entry };
      }
      if (
        args.path === "../db/index.js" &&
        args.resolveDir.includes(path.sep + "packages" + path.sep + "domain")
      ) {
        return { path: dbD1Entry };
      }
      return undefined;
    });
  },
};

await esbuild.build({
  entryPoints: [path.resolve(root, "worker/index.ts")],
  bundle: true,
  platform: "browser",
  format: "esm",
  target: "es2022",
  outfile,
  sourcemap: true,
  legalComments: "none",
  external: [
    "node:*",
    "fs",
    "path",
    "crypto",
    "http",
    "https",
    "stream",
    "buffer",
    "util",
    "os",
    "zlib",
    "tty",
    "net",
    "events",
    "assert",
    "querystring",
  ],
  plugins: [dbAliasPlugin],
  logLevel: "info",
});

console.log("Worker bundle written to", outfile);
