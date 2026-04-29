-- PoolOps · Migration 005
-- Multi-pool jobs: replaces jobs.pool_id with a job_pools join table.
-- A job can now cover one or more pools belonging to the same customer.
-- Service records become per-pool (one record per pool per job).

-- 1. Join table: links a job to one or more pools
CREATE TABLE job_pools (
    job_id   uuid NOT NULL REFERENCES jobs(id)  ON DELETE CASCADE,
    pool_id  uuid NOT NULL REFERENCES pools(id) ON DELETE RESTRICT,
    PRIMARY KEY (job_id, pool_id)
);

CREATE INDEX idx_job_pools_job  ON job_pools (job_id);
CREATE INDEX idx_job_pools_pool ON job_pools (pool_id);

-- 2. Migrate existing single-pool associations
INSERT INTO job_pools (job_id, pool_id)
SELECT id, pool_id FROM jobs WHERE pool_id IS NOT NULL;

-- 3. Drop the UNIQUE constraint on service_records.job_id
--    (multiple records per job are now valid — one per pool)
ALTER TABLE service_records DROP CONSTRAINT service_records_job_id_key;

-- 4. Composite unique: one service record per pool per job
ALTER TABLE service_records
    ADD CONSTRAINT service_records_job_pool_key UNIQUE (job_id, pool_id);

-- 5. Remove pool_id from jobs (now stored in job_pools)
ALTER TABLE jobs DROP COLUMN pool_id;

-- 6. Update technician RLS policies that joined through jobs.pool_id

DROP POLICY pools_technician_select_assigned ON pools;
CREATE POLICY pools_technician_select_assigned ON pools
FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND public.app_role() = 'technician'
    AND company_id = public.app_company_id()
    AND EXISTS (
        SELECT 1 FROM job_pools jp
        JOIN jobs j ON j.id = jp.job_id
        WHERE jp.pool_id = pools.id
          AND j.technician_id = auth.uid()
          AND j.company_id = public.app_company_id()
    )
);

DROP POLICY customers_technician_select_assigned ON customers;
CREATE POLICY customers_technician_select_assigned ON customers
FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND public.app_role() = 'technician'
    AND company_id = public.app_company_id()
    AND EXISTS (
        SELECT 1 FROM job_pools jp
        JOIN jobs j ON j.id = jp.job_id
        JOIN pools p ON p.id = jp.pool_id
        WHERE p.customer_id = customers.id
          AND j.technician_id = auth.uid()
          AND j.company_id = public.app_company_id()
    )
);

-- 7. RLS for job_pools
ALTER TABLE job_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_pools FORCE ROW LEVEL SECURITY;

CREATE POLICY job_pools_admin_all ON job_pools
FOR ALL USING (
    auth.uid() IS NOT NULL
    AND public.app_role() = 'admin'
    AND EXISTS (
        SELECT 1 FROM jobs j
        WHERE j.id = job_pools.job_id
          AND j.company_id = public.app_company_id()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM jobs j
        WHERE j.id = job_pools.job_id
          AND j.company_id = public.app_company_id()
    )
);

CREATE POLICY job_pools_technician_select ON job_pools
FOR SELECT USING (
    auth.uid() IS NOT NULL
    AND public.app_role() = 'technician'
    AND EXISTS (
        SELECT 1 FROM jobs j
        WHERE j.id = job_pools.job_id
          AND j.technician_id = auth.uid()
          AND j.company_id = public.app_company_id()
    )
);

-- 8. Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE job_pools TO service_role;
GRANT SELECT, INSERT, DELETE ON TABLE job_pools TO authenticated;
