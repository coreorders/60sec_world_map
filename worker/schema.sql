CREATE TABLE IF NOT EXISTS scores (
  id TEXT PRIMARY KEY,
  game_mode TEXT NOT NULL DEFAULT 'COUNTRY',
  nickname TEXT NOT NULL,
  score INTEGER NOT NULL,
  accuracy INTEGER NOT NULL,
  attempts INTEGER NOT NULL,
  locale TEXT NOT NULL DEFAULT 'ko',
  device_type TEXT NOT NULL DEFAULT 'unknown',
  browser TEXT NOT NULL DEFAULT 'unknown',
  country_code TEXT NOT NULL DEFAULT 'XX',
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scores_monthly_rank
ON scores (game_mode, created_at, score DESC, accuracy DESC);

CREATE INDEX IF NOT EXISTS idx_scores_rank
ON scores (game_mode, score DESC, accuracy DESC, created_at ASC);
