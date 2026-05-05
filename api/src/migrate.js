import pg from 'pg';
import { env } from './config/env.js';

const { Client } = pg;

const MIGRATIONS = [
  {
    id: '004_service_role_grants',
    sql: `GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
      companies, profiles, chemical_products, chemical_stock,
      customers, pools, service_plans, jobs, service_records,
      booking_requests, inbox_items, notifications, audit_log,
      sync_queue, pool_equipment
    TO service_role`,
  },
  {
    id: '008_settings_columns',
    sql: `
      ALTER TABLE companies ADD COLUMN IF NOT EXISTS company_chemicals JSONB;
      ALTER TABLE companies ADD COLUMN IF NOT EXISTS service_defaults JSONB;
      ALTER TABLE companies ADD COLUMN IF NOT EXISTS report_branding JSONB;
    `,
  },
  {
    id: '006_subscription_and_invite',
    sql: `
      DO $$ BEGIN
        CREATE TYPE subscription_status AS ENUM ('trialing', 'active', 'past_due', 'cancelled');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;

      ALTER TABLE companies
        ADD COLUMN IF NOT EXISTS subscription_status subscription_status NOT NULL DEFAULT 'trialing',
        ADD COLUMN IF NOT EXISTS trial_started_at timestamptz,
        ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;

      UPDATE companies SET subscription_status = 'active' WHERE subscription_status = 'trialing';

      ALTER TABLE profiles ADD COLUMN IF NOT EXISTS invite_token text UNIQUE;
      CREATE INDEX IF NOT EXISTS idx_profiles_invite_token ON profiles (invite_token) WHERE invite_token IS NOT NULL;
    `,
  },
];

export async function runMigrations() {
  if (!env.DATABASE_URL) {
    console.log('[migrate] DATABASE_URL not set, skipping migrations');
    return;
  }

  const client = new Client({ connectionString: env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _applied_migrations (
        id TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    for (const m of MIGRATIONS) {
      const { rows } = await client.query('SELECT id FROM _applied_migrations WHERE id = $1', [m.id]);
      if (rows.length > 0) continue;

      await client.query(m.sql);
      await client.query('INSERT INTO _applied_migrations (id) VALUES ($1)', [m.id]);
      console.log(`[migrate] applied ${m.id}`);
    }
  } finally {
    await client.end();
  }
}
