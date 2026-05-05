ALTER TABLE pools ADD COLUMN IF NOT EXISTS pool_category TEXT NOT NULL DEFAULT 'pool' CHECK (pool_category IN ('pool', 'spa'));
