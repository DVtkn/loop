DROP TABLE IF EXISTS couple_pets CASCADE;--> statement-breakpoint
CREATE TABLE couple_pets (
   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
   couple_id text NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
   pair_key varchar(120) NOT NULL UNIQUE,
   
   -- Identification and birth status
   species varchar(20) NOT NULL DEFAULT 'dog',
   name varchar(50) NOT NULL DEFAULT 'Бусинка',
   name_status varchar(20) NOT NULL DEFAULT 'confirmed',
   name_proposed_by text REFERENCES users(id),
   is_onboarding_completed boolean NOT NULL DEFAULT false,
   
   -- Life stats (0-100)
   hunger integer NOT NULL DEFAULT 85,
   joy integer NOT NULL DEFAULT 90,
   energy integer NOT NULL DEFAULT 65,
   cleanliness integer NOT NULL DEFAULT 80,
   mood varchar(20) NOT NULL DEFAULT 'happy',
   
   -- Progress and level
   level integer NOT NULL DEFAULT 1,
   experience integer NOT NULL DEFAULT 0,
   weight_kg numeric(4, 2) NOT NULL DEFAULT '1.20',
   
   -- Timestamps for stat decay calculation
   last_fed_at timestamptz NOT NULL DEFAULT now(),
   last_played_at timestamptz NOT NULL DEFAULT now(),
   last_rested_at timestamptz NOT NULL DEFAULT now(),
   last_washed_at timestamptz NOT NULL DEFAULT now(),
   last_interaction_at timestamptz NOT NULL DEFAULT now(),
   last_action_by text REFERENCES users(id),
   
   created_at timestamptz NOT NULL DEFAULT now(),
   updated_at timestamptz NOT NULL DEFAULT now()
);--> statement-breakpoint
CREATE INDEX couple_pets_created_idx ON couple_pets(created_at);--> statement-breakpoint
CREATE INDEX couple_pets_couple_id_idx ON couple_pets(couple_id);--> statement-breakpoint
CREATE INDEX couple_pets_pair_key_idx ON couple_pets(pair_key);