-- Labs authored through /admin (see src/routes/admin) instead of the
-- code+Markdown labs under src/content/. Same "shared store, no deploy
-- needed" pattern as iterverse_type's content_sources table
-- (iterverse_type/migrations/0001_init.sql) - an edit here shows up on
-- the site the next time a visitor's browser fetches /api/labs, not on
-- the next deploy.
CREATE TABLE labs (
	id TEXT PRIMARY KEY,
	name TEXT NOT NULL,
	icon TEXT NOT NULL DEFAULT 'terminal',
	subtitle TEXT NOT NULL DEFAULT '',
	description TEXT NOT NULL DEFAULT '',
	tags TEXT NOT NULL DEFAULT '[]', -- JSON array of strings
	tools TEXT NOT NULL DEFAULT '[]', -- JSON array of strings
	difficulty TEXT NOT NULL DEFAULT '[]', -- JSON array of strings
	active INTEGER NOT NULL DEFAULT 1, -- archived (0) labs stay out of the public /api/labs list
	position INTEGER NOT NULL DEFAULT 0, -- display order on the home page
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lab_steps (
	id TEXT PRIMARY KEY,
	lab_id TEXT NOT NULL REFERENCES labs(id) ON DELETE CASCADE,
	position INTEGER NOT NULL,
	name TEXT NOT NULL,
	subtitle TEXT NOT NULL DEFAULT '',
	header INTEGER NOT NULL DEFAULT 0, -- matches config.js steps[].header: starts a new TOC section
	content TEXT NOT NULL DEFAULT '', -- Markdown, rendered by src/lib/markdown.js
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lab_steps_lab_id ON lab_steps(lab_id);
