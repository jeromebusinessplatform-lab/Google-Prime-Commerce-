-- PRIME commerce — initial D1 schema (Cloudflare D1).
-- Mirrors packages/db-d1 SCHEMA_SQL; applied locally by the adapter and on
-- Cloudflare via `wrangler d1 migrations apply`.

CREATE TABLE IF NOT EXISTS documents (
  path TEXT NOT NULL,
  id TEXT NOT NULL,
  data TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  PRIMARY KEY (path, id)
);

CREATE INDEX IF NOT EXISTS idx_documents_path ON documents(path);
