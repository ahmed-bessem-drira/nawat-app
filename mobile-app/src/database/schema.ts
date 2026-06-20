// SQLite Schema for NAWAT FOCUS Mobile App
// Using Expo SQLite

export const SQL_SCHEMA = `
-- Child Profile
CREATE TABLE IF NOT EXISTS child (
  id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL,
  avatar TEXT NOT NULL,
  language TEXT NOT NULL,
  unique_code TEXT,
  created_at INTEGER NOT NULL
);

-- Mood Entries
CREATE TABLE IF NOT EXISTS mood_entry (
  id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL,
  mood TEXT NOT NULL,
  synced INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (child_id) REFERENCES child(id) ON DELETE CASCADE
);

-- Sessions
CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL,
  game_type TEXT NOT NULL,
  duration INTEGER NOT NULL,
  synced INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (child_id) REFERENCES child(id) ON DELETE CASCADE
);

-- Game Metrics
CREATE TABLE IF NOT EXISTS game_metrics (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  child_id TEXT NOT NULL,
  game_type TEXT NOT NULL,
  omissions INTEGER,
  commissions INTEGER,
  reaction_time REAL,
  reaction_time_variability REAL,
  accuracy REAL,
  smoothness REAL,
  completion_time INTEGER,
  path_deviation REAL,
  calm_score REAL,
  impulsive_responses INTEGER,
  correct_inhibition INTEGER,
  correct_sequence INTEGER,
  synced INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (session_id) REFERENCES session(id) ON DELETE CASCADE,
  FOREIGN KEY (child_id) REFERENCES child(id) ON DELETE CASCADE
);

-- Rewards (Focus Garden)
CREATE TABLE IF NOT EXISTS reward (
  id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL,
  water_drops INTEGER DEFAULT 0,
  flowers INTEGER DEFAULT 0,
  trees INTEGER DEFAULT 0,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (child_id) REFERENCES child(id) ON DELETE CASCADE
);

-- Recommendations (cached from server)
CREATE TABLE IF NOT EXISTS recommendation (
  id TEXT PRIMARY KEY,
  child_id TEXT NOT NULL,
  content TEXT NOT NULL,
  encouragement TEXT NOT NULL,
  suggested_activity TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (child_id) REFERENCES child(id) ON DELETE CASCADE
);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_mood_child ON mood_entry(child_id);
CREATE INDEX IF NOT EXISTS idx_session_child ON session(child_id);
CREATE INDEX IF NOT EXISTS idx_metrics_child ON game_metrics(child_id);
CREATE INDEX IF NOT EXISTS idx_metrics_session ON game_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_reward_child ON reward(child_id);
CREATE INDEX IF NOT EXISTS idx_recommendation_child ON recommendation(child_id);
`;

export const INIT_DB = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
${SQL_SCHEMA}
`;
