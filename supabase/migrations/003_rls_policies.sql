-- PoolOps · RLS Policies
-- Applies after 001_initial_schema.sql and 002_equipment_spa_admin_jobs.sql

-- ============================================================
-- Helper functions
-- ============================================================

CREATE OR REPLACE FUNCTION public.app_role()
RETURNS user_role
LANGUAGE sql
STABLE
AS $$
  SELECT p.role FROM profiles p WHERE p.id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.app_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT p.company_id FROM profiles p WHERE p.id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.owner_company_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT c.company_id FROM customers c WHERE c.user_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.can_access_notification(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT (
    target_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = target_user_id
        AND p.company_id = public.app_company_id()
    )
    OR EXISTS (
      SELECT 1 FROM customers c
      WHERE c.user_id = target_user_id
        AND c.company_id = public.app_company_id()
    )
  )
$$;

-- ============================================================
-- View for pool owner service record access (office_note excluded)
-- ============================================================

CREATE OR REPLACE VIEW public.service_records_owner_view
WITH (security_invoker = false)
AS
SELECT
  sr.id,
  sr.ref,
  sr.job_id,
  sr.pool_id,
  sr.company_id,
  sr.technician_id,
  sr.customer_id,
  sr.completed_at,
  sr.duration_seconds,
  sr.readings,
  sr.lsi_score,
  sr.lsi_label,
  sr.treatments,
  sr.photo_urls,
  sr.customer_note,
  sr.is_flagged,
  sr.flagged_readings,
  sr.report_sent_at,
  sr.locked
FROM service_records sr
JOIN customers c ON c.id = sr.customer_id
WHERE auth.uid() IS NOT NULL
  AND public.app_role() = 'pool_owner'
  AND c.user_id = auth.uid();

-- ============================================================
-- Enable + force RLS on all application tables
-- ============================================================

ALTER TABLE companies         ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE chemical_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE chemical_stock    ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE pools             ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_plans     ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_records   ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log         ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue        ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_equipment    ENABLE ROW LEVEL SECURITY;

ALTER TABLE companies         FORCE ROW LEVEL SECURITY;
ALTER TABLE profiles          FORCE ROW LEVEL SECURITY;
ALTER TABLE chemical_products FORCE ROW LEVEL SECURITY;
ALTER TABLE chemical_stock    FORCE ROW LEVEL SECURITY;
ALTER TABLE customers         FORCE ROW LEVEL SECURITY;
ALTER TABLE pools             FORCE ROW LEVEL SECURITY;
ALTER TABLE service_plans     FORCE ROW LEVEL SECURITY;
ALTER TABLE jobs              FORCE ROW LEVEL SECURITY;
ALTER TABLE service_records   FORCE ROW LEVEL SECURITY;
ALTER TABLE booking_requests  FORCE ROW LEVEL SECURITY;
ALTER TABLE inbox_items       FORCE ROW LEVEL SECURITY;
ALTER TABLE notifications     FORCE ROW LEVEL SECURITY;
ALTER TABLE audit_log         FORCE ROW LEVEL SECURITY;
ALTER TABLE sync_queue        FORCE ROW LEVEL SECURITY;
ALTER TABLE pool_equipment    FORCE ROW LEVEL SECURITY;

-- ============================================================
-- companies
-- ============================================================

CREATE POLICY companies_admin_select ON companies
FOR SELECT USING (
  auth.uid() IS NOT NULL
  AND public.app_role() = 'admin'
  AND id = public.app_company_id()
);

CREATE POLICY companies_admin_update ON companies
FOR UPDATE USING (
  auth.uid() IS NOT NULL
  AND public.app_role() = 'admin'
  AND id = public.app_company_id()
)
WITH CHECK (
  id = public.app_company_id()
);

-- ============================================================
-- profiles
-- ============================================================

CREATE POLICY profiles_self_select ON profiles
FOR SELECT USING (
  auth.uid() IS NOT NULL
  AND id = auth.uid()
);

CREATE POLICY profiles_admin_select_company ON profiles
FOR SELECT USING (
  auth.uid() IS NOT NULL
  AND public.app_role() = 'admin'
  AND company_id = public.app_company_id()
);

CREATE POLICY profiles_admin_insert_company ON profiles
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.app_role() = 'admin'
  AND company_id = public.app_company_id()
);

CREATE POLICY profiles_admin_update_company ON profiles
FOR UPDATE USING (
  auth.uid() IS NOT NULL
  AND public.app_role() = 'admin'
  AND company_id = public.app_company_id()
)
WITH CHECK (
  company_id = public.app_company_id()
);

CREATE POLICY profiles_technician_update_self ON profiles
FOR UPDATE USING (
  auth.uid() IS NOT NULL
  AND public.app_role() = 'technician'
  AND id = auth.uid()
)
WITH CHECK (
  id = auth.uid()
  AND role = 'technician'
  AND company_id = public.app_company_id()
);

CREATE POLICY profiles_pool_owner_update_self ON profiles
FOR UPDATE USING (
  auth.uid() IS NOT NULL
  AND public.app_role() = 'pool_owner'
  AND id = auth.uid()
)
WITH CHECK (
  id = auth.uid()
  AND role = 'pool_owner'
  AND company_id IS NULL
);

-- ============================================================
-- company-scoped tables (admin full CRUD)
-- ============================================================

CREATE POLICY chemical_products_admin_all ON chemical_products
FOR ALL USING (
  auth.uid() IS NOT NULL
  AND public.app_role() = 'admin'
  AND company_id = public.app_company_id()
)
WITH CHECK (company_id = public.app_company_id());

CREATE POLICY chemical_stock_admin_all ON chemical_stock
FOR ALL USING (
  auth.uid() IS NOT NULL
  AND public.app_role() = 'admin'
  AND company_id = public.app_company_id()
)
WITH CHECK (company_id = public.app_company_id());

CREATE POLICY customers_admin_all ON customers
FOR ALL USING (
  auth.uid() IS NOT NULL
  AND public.app_role() = 'admin'
  AND company_id = public.app_company_id()
)
WITH CHECK (company_id = public.app_company_id());

CREATE POLICY pools_admin_all ON pools
FOR ALL USING (
  auth.uid() IS NOT NULL
  AND public.app_role() = 'admin'
  AND company_id = public.app_company_id()
)
WITH CHECK (company_id = public.app_company_id());

CREATE POLICY service_plans_admin_all ON service_plans
FOR ALL USING (
  auth.uid() IS NOT NULL
  AND public.app_role() = 'admin'
  AND company_id = public.app_company_id()
)
WITH CHECK (company_id = public.app_company_id());

CREATE POLICY jobs_admin_all ON jobs
FOR ALL USING (
  auth.uid() IS NOT NULL
  AND public.app_role() = 'admin'
  AND company_id = public.app_company_id()
)
WITH CHECK (company_id = public.app_company_id());

CREATE POLICY service_records_admin_all ON service_records
FOR ALL USING (
  auth.uid() IS NOT NULL
  AND public.app_role() = 'admin'
  AND company_id = public.app_company_id()
)
WITH CHECK (company_id = public.app_company_id());

CREATE POLICY booking_requests_admin_all ON booking_requests
FOR ALL USING (
  auth.uid() IS NOT NULL
  AND public.app_role() = 'admin'
  AND company_id = public.app_company_id()
)
WITH CHECK (company_id = public.app_company_id());

CREATE POLICY inbox_items_admin_all ON inbox_items
FOR ALL USING (
  auth.uid() IS NOT NULL
  AND public.app_role() = 'admin'
  AND company_id = public.app_company_id()
)
WITH CHECK (company_id = public.app_company_id());

CREATE POLICY audit_log_admin_all ON audit_log
FOR ALL USING (
  auth.uid() IS NOT NULL
  AND public.app_role() = 'admin'
  AND company_id = public.app_company_id()
)
WITH CHECK (company_id = public.app_company_id());

CREATE POLICY sync_queue_admin_all ON sync_queue
FOR ALL USING (
  auth.uid() IS NOT NULL
  AND public.app_role() = 'admin'
  AND company_id = public.app_company_id()
)
WITH CHECK (company_id = public.app_company_id());

CREATE POLICY pool_equipment_admin_all ON pool_equipment
FOR ALL USING (
  auth.uid() IS NOT NULL
  AND public.app_role() = 'admin'
  AND company_id = public.app_company_id()
)
WITH CHECK (company_id = public.app_company_id());

-- ============================================================
-- technician access
-- ============================================================

CREATE POLICY chemical_products_technician_select ON chemical_products
FOR SELECT USING (
  auth.uid() IS NOT NULL
  AND public.app_role() = 'technician'
  AND company_id = public.app_company_id()
);

CREATE POLICY chemical_stock_technician_select ON chemical_stock
FOR SELECT USING (
  auth.uid() IS NOT NULL
  AND public.app_role() = 'technician'
  AND company_id = public.app_company_id()
);

CREATE POLICY service_plans_technician_select ON service_plans
FOR SELECT USING (
  auth.uid() IS NOT NULL
  AND public.app_role() = 'technician'
  AND company_id = public.app_company_id()
);

CREATE POLICY booking_requests_technician_select ON booking_requests
FOR SELECT USING (
  auth.uid() IS NOT NULL
  AND public.app_role() = 'technician'
  AND company_id = public.app_company_id()
);

CREATE POLICY pool_equipment_technician_select ON pool_equipment
FOR SELECT USING (
  auth.uid() IS NOT NULL
  AND public.app_role() = 'technician'
  AND company_id = public.app_company_id()
);

CREATE POLICY jobs_technician_select_own ON jobs
FOR SELECT USING (
  auth.uid() IS NOT NULL
  AND public.app_role() = 'technician'
  AND company_id = public.app_company_id()
  AND technician_id = auth.uid()
);

CREATE POLICY jobs_technician_update_own ON jobs
FOR UPDATE USING (
  auth.uid() IS NOT NULL
  AND public.app_role() = 'technician'
  AND company_id = public.app_company_id()
  AND technician_id = auth.uid()
)
WITH CHECK (
  company_id = public.app_company_id()
  AND technician_id = auth.uid()
);

CREATE POLICY pools_technician_select_assigned ON pools
FOR SELECT USING (
  auth.uid() IS NOT NULL
  AND public.app_role() = 'technician'
  AND company_id = public.app_company_id()
  AND EXISTS (
    SELECT 1 FROM jobs j
    WHERE j.pool_id = pools.id
      AND j.technician_id = auth.uid()
      AND j.company_id = public.app_company_id()
  )
);

CREATE POLICY customers_technician_select_assigned ON customers
FOR SELECT USING (
  auth.uid() IS NOT NULL
  AND public.app_role() = 'technician'
  AND company_id = public.app_company_id()
  AND EXISTS (
    SELECT 1 FROM jobs j
    JOIN pools p ON p.id = j.pool_id
    WHERE p.customer_id = customers.id
      AND j.technician_id = auth.uid()
      AND j.company_id = public.app_company_id()
  )
);

CREATE POLICY service_records_technician_select_own ON service_records
FOR SELECT USING (
  auth.uid() IS NOT NULL
  AND public.app_role() = 'technician'
  AND company_id = public.app_company_id()
  AND technician_id = auth.uid()
);

CREATE POLICY service_records_technician_insert_own ON service_records
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.app_role() = 'technician'
  AND company_id = public.app_company_id()
  AND technician_id = auth.uid()
);

CREATE POLICY sync_queue_technician_insert_own ON sync_queue
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.app_role() = 'technician'
  AND company_id = public.app_company_id()
  AND user_id = auth.uid()
);

CREATE POLICY sync_queue_technician_select_own ON sync_queue
FOR SELECT USING (
  auth.uid() IS NOT NULL
  AND public.app_role() = 'technician'
  AND company_id = public.app_company_id()
  AND user_id = auth.uid()
);

-- ============================================================
-- pool owner access
-- ============================================================

CREATE POLICY customers_pool_owner_select_own ON customers
FOR SELECT USING (
  auth.uid() IS NOT NULL
  AND public.app_role() = 'pool_owner'
  AND user_id = auth.uid()
);

CREATE POLICY pools_pool_owner_select_own ON pools
FOR SELECT USING (
  auth.uid() IS NOT NULL
  AND public.app_role() = 'pool_owner'
  AND EXISTS (
    SELECT 1 FROM customers c
    WHERE c.id = pools.customer_id
      AND c.user_id = auth.uid()
  )
);

CREATE POLICY booking_requests_pool_owner_select_own ON booking_requests
FOR SELECT USING (
  auth.uid() IS NOT NULL
  AND public.app_role() = 'pool_owner'
  AND customer_id IN (
    SELECT c.id FROM customers c WHERE c.user_id = auth.uid()
  )
);

CREATE POLICY booking_requests_pool_owner_insert_own ON booking_requests
FOR INSERT WITH CHECK (
  auth.uid() IS NOT NULL
  AND public.app_role() = 'pool_owner'
  AND customer_id IN (
    SELECT c.id FROM customers c WHERE c.user_id = auth.uid()
  )
  AND pool_id IN (
    SELECT p.id FROM pools p
    JOIN customers c ON c.id = p.customer_id
    WHERE c.user_id = auth.uid()
  )
  AND company_id = public.owner_company_id()
);

-- ============================================================
-- notifications
-- ============================================================

CREATE POLICY notifications_self_select ON notifications
FOR SELECT USING (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
);

CREATE POLICY notifications_self_update ON notifications
FOR UPDATE USING (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
)
WITH CHECK (user_id = auth.uid());

CREATE POLICY notifications_admin_company_all ON notifications
FOR ALL USING (
  auth.uid() IS NOT NULL
  AND public.app_role() = 'admin'
  AND public.can_access_notification(user_id)
)
WITH CHECK (
  public.can_access_notification(user_id)
);

-- ============================================================
-- Column-level grants for role-required write restrictions
-- ============================================================

REVOKE ALL ON TABLE profiles FROM anon, authenticated;
REVOKE ALL ON TABLE jobs FROM anon, authenticated;
REVOKE ALL ON TABLE notifications FROM anon, authenticated;
REVOKE ALL ON TABLE service_records FROM anon, authenticated;
REVOKE ALL ON TABLE booking_requests FROM anon, authenticated;
REVOKE ALL ON TABLE sync_queue FROM anon, authenticated;

GRANT SELECT ON TABLE profiles TO authenticated;
GRANT UPDATE (push_token, notification_prefs) ON TABLE profiles TO authenticated;

GRANT SELECT ON TABLE jobs TO authenticated;
GRANT UPDATE (status, started_at, completed_at) ON TABLE jobs TO authenticated;

GRANT SELECT, INSERT ON TABLE service_records TO authenticated;

GRANT SELECT, INSERT ON TABLE booking_requests TO authenticated;

GRANT SELECT, INSERT ON TABLE sync_queue TO authenticated;

GRANT SELECT ON TABLE notifications TO authenticated;
GRANT UPDATE (read) ON TABLE notifications TO authenticated;

GRANT SELECT ON public.service_records_owner_view TO authenticated;
