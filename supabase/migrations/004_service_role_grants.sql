-- service_role inherits from anon in Supabase. Migration 003 revoked ALL from anon on
-- sensitive tables and re-granted only to authenticated, which left service_role without
-- table access. Re-grant full access to service_role for API-level queries.

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  companies,
  profiles,
  chemical_products,
  chemical_stock,
  customers,
  pools,
  service_plans,
  jobs,
  service_records,
  booking_requests,
  inbox_items,
  notifications,
  audit_log,
  sync_queue,
  pool_equipment
TO service_role;
