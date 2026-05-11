import Database, { Database as DatabaseType } from "better-sqlite3";
import path from "path";
import fs from "fs";
import logger from "../logger.js";

const DB_PATH = process.env.DATABASE_URL?.replace("file:", "") ?? "./data/app.db";

// Ensure directory exists
const dir = path.dirname(path.resolve(DB_PATH));
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const db: DatabaseType = new Database(path.resolve(DB_PATH));

// Enable WAL for better concurrency
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ── Schema ────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    email       TEXT UNIQUE NOT NULL,
    password    TEXT NOT NULL,
    name        TEXT NOT NULL,
    plan        TEXT NOT NULL DEFAULT 'free',
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token       TEXT UNIQUE NOT NULL,
    expires_at  TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS projects (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    url         TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'pending',
    analysis_id TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_token   ON sessions(token);

  CREATE TABLE IF NOT EXISTS crawl_cache (
    id          TEXT PRIMARY KEY,
    url         TEXT UNIQUE NOT NULL,
    data        TEXT NOT NULL,
    crawled_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

logger.info(`Database ready: ${path.resolve(DB_PATH)}`);

export default db;
