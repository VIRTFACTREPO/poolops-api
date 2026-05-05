-- Add settings JSONB columns to companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS company_chemicals JSONB;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS service_defaults JSONB;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS report_branding JSONB;

-- Reset service_defaults and report_branding to NULL so API defaults kick in
-- (columns previously had old-format data incompatible with new schema)
UPDATE companies SET service_defaults = NULL WHERE service_defaults IS NOT NULL
  AND (service_defaults->>'ph_min') IS NULL;
UPDATE companies SET report_branding = NULL WHERE report_branding IS NOT NULL
  AND (report_branding->>'show_tech_name') IS NULL;
