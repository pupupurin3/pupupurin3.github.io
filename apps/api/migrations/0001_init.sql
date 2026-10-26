-- Initial schema for the portfolio API.
-- Timestamps are Unix epoch milliseconds (INTEGER) so they sort and compare
-- cheaply; the API formats them as ISO 8601 strings.
-- Visitors are identified only by a salted SHA-256 hash of their IP address.

-- Guestbook: every entry starts as 'pending' and shows up once approved.
CREATE TABLE guestbook_entries (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT    NOT NULL,
  message      TEXT    NOT NULL,
  status       TEXT    NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending', 'approved', 'rejected')),
  visitor_hash TEXT    NOT NULL,
  created_at   INTEGER NOT NULL,
  reviewed_at  INTEGER
);
-- Public listing pages through approved entries newest first.
CREATE INDEX guestbook_status_id ON guestbook_entries (status, id DESC);

-- Contact form submissions, read through the admin API.
CREATE TABLE contact_messages (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT    NOT NULL,
  email        TEXT    NOT NULL,
  message      TEXT    NOT NULL,
  visitor_hash TEXT    NOT NULL,
  created_at   INTEGER NOT NULL
);

-- Running totals per project, kept up to date by the triggers below so
-- reading every project's stats is a single small table scan.
CREATE TABLE project_counters (
  slug  TEXT    PRIMARY KEY,
  views INTEGER NOT NULL DEFAULT 0 CHECK (views >= 0),
  likes INTEGER NOT NULL DEFAULT 0 CHECK (likes >= 0)
) WITHOUT ROWID;

-- One row per project, visitor and UTC day: a visitor opening the same
-- project again that day doesn't count twice. Old days are pruned nightly;
-- the totals live on in project_counters.
CREATE TABLE project_views (
  slug         TEXT    NOT NULL,
  visitor_hash TEXT    NOT NULL,
  day          TEXT    NOT NULL, -- YYYY-MM-DD
  PRIMARY KEY (slug, visitor_hash, day)
) WITHOUT ROWID;
CREATE INDEX project_views_day ON project_views (day);

CREATE TABLE project_likes (
  slug         TEXT    NOT NULL,
  visitor_hash TEXT    NOT NULL,
  created_at   INTEGER NOT NULL,
  PRIMARY KEY (slug, visitor_hash)
) WITHOUT ROWID;

CREATE TRIGGER project_views_count AFTER INSERT ON project_views
BEGIN
  INSERT INTO project_counters (slug, views) VALUES (NEW.slug, 1)
  ON CONFLICT (slug) DO UPDATE SET views = views + 1;
END;

CREATE TRIGGER project_likes_add AFTER INSERT ON project_likes
BEGIN
  INSERT INTO project_counters (slug, likes) VALUES (NEW.slug, 1)
  ON CONFLICT (slug) DO UPDATE SET likes = likes + 1;
END;

CREATE TRIGGER project_likes_remove AFTER DELETE ON project_likes
BEGIN
  UPDATE project_counters SET likes = likes - 1 WHERE slug = OLD.slug;
END;

-- Platformer runs. A run is created when the visitor starts playing and
-- finished once; its time is measured here, never taken from the client.
CREATE TABLE game_runs (
  id           TEXT    PRIMARY KEY, -- UUID
  visitor_hash TEXT    NOT NULL,
  started_at   INTEGER NOT NULL,
  finished_at  INTEGER,
  name         TEXT,
  time_ms      INTEGER,
  CHECK ((finished_at IS NULL) = (time_ms IS NULL))
);
-- Leaderboard: fastest finished runs.
CREATE INDEX game_runs_leaderboard ON game_runs (time_ms) WHERE time_ms IS NOT NULL;
CREATE INDEX game_runs_unfinished ON game_runs (started_at) WHERE finished_at IS NULL;

-- Fixed-window rate limiting: one row per (bucket, window).
CREATE TABLE rate_limits (
  key          TEXT    NOT NULL,
  window_start INTEGER NOT NULL,
  count        INTEGER NOT NULL,
  PRIMARY KEY (key, window_start)
) WITHOUT ROWID;
CREATE INDEX rate_limits_window ON rate_limits (window_start);
