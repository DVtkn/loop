-- Drop the old couple_pets table and recreate with proper schema
DROP TABLE IF EXISTS couple_pets CASCADE;

CREATE TABLE couple_pets (
  id text PRIMARY KEY,
  name text NOT NULL DEFAULT 'Мурчик',
  hunger integer NOT NULL DEFAULT 80,
  energy integer NOT NULL DEFAULT 80,
  joy integer NOT NULL DEFAULT 80,
  level integer NOT NULL DEFAULT 1,
  exp integer NOT NULL DEFAULT 0,
  mood text NOT NULL DEFAULT 'happy',
  last_fed_at text,
  last_played_at text,
  last_slept_at text,
  last_petted_at text,
  created_at text NOT NULL,
  updated_at text NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS couple_pets_created_idx ON couple_pets(created_at);