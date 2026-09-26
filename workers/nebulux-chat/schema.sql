-- Nebulux Chat database (Cloudflare D1). Apply: npx wrangler d1 execute nebulux-chat --remote --file schema.sql
CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT '🌌',       -- an emoji
  avatar_bg TEXT NOT NULL DEFAULT '#6366f1',
  name_color TEXT NOT NULL DEFAULT '#e2e8f0',
  frame TEXT NOT NULL DEFAULT '',            -- avatar frame id (bought with orbs)
  badge TEXT NOT NULL DEFAULT '',            -- badge id (bought with orbs)
  bio TEXT NOT NULL DEFAULT '',
  orbs INTEGER NOT NULL DEFAULT 0,
  owned TEXT NOT NULL DEFAULT '[]',          -- JSON list of shop item ids
  daily_at TEXT NOT NULL DEFAULT '',         -- last daily orbs claim (YYYY-MM-DD)
  earned_day TEXT NOT NULL DEFAULT '',       -- chat orbs counted per day
  earned_today INTEGER NOT NULL DEFAULT 0,
  is_admin INTEGER NOT NULL DEFAULT 0,
  banned INTEGER NOT NULL DEFAULT 0,
  last_seen TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS profiles_name ON profiles (lower(name));

CREATE TABLE IF NOT EXISTS channels (
  id TEXT PRIMARY KEY,                       -- "general", or "dm:<userA>:<userB>" (sorted)
  server_id TEXT NOT NULL,                   -- "nebulux" or "dm"
  name TEXT NOT NULL,
  topic TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  text TEXT NOT NULL,
  reply_to INTEGER,
  reactions TEXT NOT NULL DEFAULT '{}',     -- {"👍": ["userId", ...]}
  edited_at TEXT,
  deleted INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS messages_channel ON messages (channel_id, id);

CREATE TABLE IF NOT EXISTS friends (
  a TEXT NOT NULL,                           -- who asked
  b TEXT NOT NULL,                           -- who was asked
  status TEXT NOT NULL,                      -- pending | accepted
  created_at TEXT NOT NULL,
  PRIMARY KEY (a, b)
);
CREATE INDEX IF NOT EXISTS friends_b ON friends (b);

CREATE TABLE IF NOT EXISTS blocks (
  user_id TEXT NOT NULL,
  blocked_id TEXT NOT NULL,
  PRIMARY KEY (user_id, blocked_id)
);

CREATE TABLE IF NOT EXISTS reads (
  user_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  last_id INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, channel_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  kind TEXT NOT NULL,                        -- message | friend | reward | update | purchase | ai
  text TEXT NOT NULL,
  link TEXT NOT NULL DEFAULT '',
  read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS notifications_user ON notifications (user_id, id);

CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter_id TEXT NOT NULL,
  message_id INTEGER,
  user_id TEXT,
  reason TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL
);

INSERT OR IGNORE INTO channels (id, server_id, name, topic, position, created_at) VALUES
  ('welcome', 'nebulux', 'welcome', 'Say hi! Be kind, keep it safe, no personal info.', 0, datetime('now')),
  ('general', 'nebulux', 'general', 'Chat about anything', 1, datetime('now')),
  ('homework-help', 'nebulux', 'homework-help', 'Help each other learn', 2, datetime('now')),
  ('show-your-builds', 'nebulux', 'show-your-builds', 'Share websites and games you made', 3, datetime('now')),
  ('ideas', 'nebulux', 'ideas', 'Ideas for Nebulux AI', 4, datetime('now'));
