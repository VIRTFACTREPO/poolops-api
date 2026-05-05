ALTER TABLE companies ADD COLUMN IF NOT EXISTS company_chemicals JSONB;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS service_defaults JSONB;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS report_branding JSONB;
