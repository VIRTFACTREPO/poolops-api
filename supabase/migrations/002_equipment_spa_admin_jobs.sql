-- PoolOps · Migration 002
-- Adds spa pool support, equipment tracking, and admin-created non-routine jobs

-- 1) Add spa to pool type enum
ALTER TYPE pool_type_enum ADD VALUE 'spa';

-- 2) New enum: job_type
CREATE TYPE job_type AS ENUM ('routine_service', 'maintenance', 'repair', 'inspection');

-- 3) New table: pool_equipment
CREATE TABLE pool_equipment (
    id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    pool_id         uuid        NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
    company_id      uuid        NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name            text        NOT NULL,
    equipment_type  text        NOT NULL,
    manufacturer    text,
    model           text,
    serial_number   text,
    installed_at    date,
    notes           text,
    active          boolean     NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now()
);

-- 4) Alter jobs table — add 4 columns
ALTER TABLE jobs
    ADD COLUMN job_type         job_type    NOT NULL DEFAULT 'routine_service',
    ADD COLUMN created_by       uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN work_description text,
    ADD COLUMN equipment_id     uuid        REFERENCES pool_equipment(id) ON DELETE SET NULL;

-- 5) Indexes
CREATE INDEX idx_pool_equipment_pool    ON pool_equipment (pool_id);
CREATE INDEX idx_pool_equipment_company ON pool_equipment (company_id);
CREATE INDEX idx_jobs_type_date         ON jobs (company_id, job_type, scheduled_date);
