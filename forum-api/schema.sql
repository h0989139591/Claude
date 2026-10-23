-- Cloudflare D1 schema for the compliant adult / LGBTQ+ forum.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE,
  phone         TEXT UNIQUE,
  password_hash TEXT NOT NULL,                       -- "pbkdf2$iter$salt$hash"
  role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin','user')),
  is_verified   INTEGER NOT NULL DEFAULT 0 CHECK (is_verified IN (0,1)),
  is_banned     INTEGER NOT NULL DEFAULT 0 CHECK (is_banned IN (0,1)),
  birth_year    INTEGER NOT NULL,                    -- 18+ self-declaration (upgrade to ID/age verification vendor)
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS posts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id),
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  category   TEXT NOT NULL DEFAULT 'general',
  status     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('published','pending','blocked')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status, created_at);
CREATE INDEX IF NOT EXISTS idx_posts_user   ON posts(user_id);

CREATE TABLE IF NOT EXISTS media (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id        INTEGER REFERENCES posts(id),       -- nullable: upload may precede the post
  user_id        INTEGER NOT NULL REFERENCES users(id),
  r2_url         TEXT NOT NULL,                      -- R2 object key
  nsfw_score     REAL NOT NULL DEFAULT 0,
  minor_score    REAL NOT NULL DEFAULT 0,            -- 兒少 (possible minor) score
  ai_flag_reason TEXT,
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('approved','pending','blocked'))
);
CREATE INDEX IF NOT EXISTS idx_media_status ON media(status);

CREATE TABLE IF NOT EXISTS reports (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id     INTEGER NOT NULL REFERENCES posts(id),
  reporter_id INTEGER NOT NULL REFERENCES users(id),
  reason      TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved'))
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id   INTEGER,                                -- NULL = system action (auto-block, registration)
  action     TEXT NOT NULL,
  target_id  INTEGER,
  ip_address TEXT,
  timestamp  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action, timestamp);
