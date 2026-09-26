ALTER TABLE profiles ADD COLUMN invite_code TEXT;
ALTER TABLE profiles ADD COLUMN invited_by TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_invite ON profiles (invite_code);
CREATE TABLE IF NOT EXISTS quests_done (
  user_id TEXT NOT NULL,
  quest_id TEXT NOT NULL,
  orbs INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, quest_id)
);
