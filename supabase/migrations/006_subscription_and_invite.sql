-- PoolOps · Migration 006
-- Subscription lifecycle tracking and invite token index on profiles.

-- Subscription status enum
CREATE TYPE subscription_status AS ENUM ('trialing', 'active', 'past_due', 'cancelled');

ALTER TABLE companies
  ADD COLUMN subscription_status subscription_status NOT NULL DEFAULT 'trialing',
  ADD COLUMN trial_started_at timestamptz,
  ADD COLUMN trial_ends_at timestamptz;

-- Backfill existing companies — they pre-date trials, treat as active
UPDATE companies SET subscription_status = 'active';

-- invite_token on profiles (for technician invite lookup without scanning auth users)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS invite_token text UNIQUE;
CREATE INDEX IF NOT EXISTS idx_profiles_invite_token ON profiles (invite_token) WHERE invite_token IS NOT NULL;
