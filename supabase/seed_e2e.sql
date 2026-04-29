-- PoolOps · E2E Test Seed Data
-- Run against the Railway/Supabase DB after all migrations.
-- Creates auth users via Supabase auth.users (for local/self-hosted only).
-- For Supabase Cloud: create these users manually in the Auth dashboard or
-- via `supabase auth admin create-user`, then update the UUIDs below.
--
-- Passwords are all: TestPassword123!
--
-- Users created:
--   admin@poolops-test.com       — company admin (web dashboard)
--   tech1@poolops-test.com       — technician with assigned jobs
--   tech2@poolops-test.com       — technician (fresh, no jobs)
--   owner@poolops-test.com       — pool owner (customer portal)
--
-- Seed data:
--   1 company: Aqua Test Co
--   2 customers (one linked to owner auth account)
--   2 pools with service plans
--   4 jobs (today + tomorrow) for tech1
--   1 flagged service record (triggers inbox + dashboard stat)
--   Standard chemical products + stock
--   1 booking request (inbox item)

-- ============================================================
-- STABLE TEST UUIDs
-- Replace these if you create auth users via the dashboard — the
-- IDs must match the auth.users rows Supabase creates.
-- ============================================================

DO $$
DECLARE
    v_company_id        uuid := 'a0000000-0000-0000-0000-000000000001';
    v_admin_id          uuid := 'b0000000-0000-0000-0000-000000000001';
    v_tech1_id          uuid := 'b0000000-0000-0000-0000-000000000002';
    v_tech2_id          uuid := 'b0000000-0000-0000-0000-000000000003';
    v_owner_id          uuid := 'b0000000-0000-0000-0000-000000000004';
    v_customer1_id      uuid := 'c0000000-0000-0000-0000-000000000001';
    v_customer2_id      uuid := 'c0000000-0000-0000-0000-000000000002';
    v_pool1_id          uuid := 'd0000000-0000-0000-0000-000000000001';
    v_pool2_id          uuid := 'd0000000-0000-0000-0000-000000000002';
    v_plan1_id          uuid := 'e0000000-0000-0000-0000-000000000001';
    v_plan2_id          uuid := 'e0000000-0000-0000-0000-000000000002';
    v_product_chlorine  uuid := 'f0000000-0000-0000-0000-000000000001';
    v_product_acid      uuid := 'f0000000-0000-0000-0000-000000000002';
    v_product_alkalinity uuid := 'f0000000-0000-0000-0000-000000000003';
    v_product_stabiliser uuid := 'f0000000-0000-0000-0000-000000000004';
    v_job1_id           uuid := '10000000-0000-0000-0000-000000000001';
    v_job2_id           uuid := '10000000-0000-0000-0000-000000000002';
    v_job3_id           uuid := '10000000-0000-0000-0000-000000000003';
    v_job4_id           uuid := '10000000-0000-0000-0000-000000000004';
    v_service_record_id uuid := '20000000-0000-0000-0000-000000000001';
    v_booking_id        uuid := '30000000-0000-0000-0000-000000000001';
    v_inbox_booking_id  uuid := '40000000-0000-0000-0000-000000000001';
    v_inbox_flagged_id  uuid := '40000000-0000-0000-0000-000000000002';
BEGIN

-- ============================================================
-- AUTH USERS
-- Local / self-hosted only. On Supabase Cloud, run
-- create_e2e_auth_users.js first — it creates these users via
-- the Admin API with the same stable UUIDs, then skip this block.
-- ============================================================

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role)
VALUES
    (v_admin_id, 'admin@poolops-test.com',
        crypt('TestPassword123!', gen_salt('bf')), now(), 'authenticated'),
    (v_tech1_id, 'tech1@poolops-test.com',
        crypt('TestPassword123!', gen_salt('bf')), now(), 'authenticated'),
    (v_tech2_id, 'tech2@poolops-test.com',
        crypt('TestPassword123!', gen_salt('bf')), now(), 'authenticated'),
    (v_owner_id, 'owner@poolops-test.com',
        crypt('TestPassword123!', gen_salt('bf')), now(), 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- COMPANY
-- ============================================================

INSERT INTO companies (id, name, email, phone, address, plan)
VALUES (
    v_company_id,
    'Aqua Test Co',
    'admin@poolops-test.com',
    '+64 9 000 0000',
    '1 Test Street, Auckland, NZ',
    'pro'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PROFILES
-- ============================================================

INSERT INTO profiles (id, email, role, company_id, full_name, phone)
VALUES
    (v_admin_id,  'admin@poolops-test.com', 'admin',       v_company_id, 'Alex Admin',    '+64 21 000 001'),
    (v_tech1_id,  'tech1@poolops-test.com', 'technician',  v_company_id, 'Taylor Tech',   '+64 21 000 002'),
    (v_tech2_id,  'tech2@poolops-test.com', 'technician',  v_company_id, 'Sam Spare',     '+64 21 000 003'),
    (v_owner_id,  'owner@poolops-test.com', 'pool_owner',  NULL,         'Owen Owner',    '+64 21 000 004')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- CHEMICAL PRODUCTS
-- ============================================================

INSERT INTO chemical_products (id, company_id, name, unit, stock_alert_threshold, sort_order)
VALUES
    (v_product_chlorine,   v_company_id, 'Liquid Chlorine',    'L',   10, 1),
    (v_product_acid,       v_company_id, 'Hydrochloric Acid',  'L',   5,  2),
    (v_product_alkalinity, v_company_id, 'Alkalinity Increaser','kg',  2,  3),
    (v_product_stabiliser, v_company_id, 'Stabiliser (CYA)',   'kg',  2,  4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO chemical_stock (company_id, product_id, current_amount)
VALUES
    (v_company_id, v_product_chlorine,   25),
    (v_company_id, v_product_acid,        8),
    (v_company_id, v_product_alkalinity,  6),
    (v_company_id, v_product_stabiliser,  1)  -- below threshold → triggers low_stock alert
ON CONFLICT (company_id, product_id) DO NOTHING;

-- ============================================================
-- CUSTOMERS
-- customer1 is linked to the owner auth account
-- customer2 has no portal login yet (invite pending)
-- ============================================================

INSERT INTO customers (id, company_id, user_id, first_name, last_name, email, phone, address)
VALUES
    (v_customer1_id, v_company_id, v_owner_id,
        'Owen', 'Owner', 'owner@poolops-test.com',
        '+64 21 000 004', '12 Poolside Lane, Auckland'),
    (v_customer2_id, v_company_id, NULL,
        'Claire', 'Customer', 'claire@example.com',
        '+64 21 000 005', '34 Harbour View Rd, Auckland')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- POOLS
-- ============================================================

INSERT INTO pools (id, customer_id, company_id, volume_litres, pool_type,
                   surface_type, indoor_outdoor, gate_access, warnings,
                   chemical_products)
VALUES
    (v_pool1_id, v_customer1_id, v_company_id,
        55000, 'salt', 'fibreglass', 'outdoor',
        'Gate code: 1234',
        'Dog on property — alert technician.',
        ARRAY[v_product_chlorine, v_product_acid, v_product_stabiliser]),
    (v_pool2_id, v_customer2_id, v_company_id,
        40000, 'chlorine', 'concrete', 'outdoor',
        NULL, NULL,
        ARRAY[v_product_chlorine, v_product_acid, v_product_alkalinity])
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SERVICE PLANS
-- ============================================================

INSERT INTO service_plans (id, pool_id, company_id, technician_id, frequency, day_of_week)
VALUES
    (v_plan1_id, v_pool1_id, v_company_id, v_tech1_id, 'weekly',      3),  -- Wednesday
    (v_plan2_id, v_pool2_id, v_company_id, v_tech1_id, 'fortnightly', 3)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- JOBS (today + tomorrow for tech1's run sheet)
-- ============================================================

INSERT INTO jobs (id, company_id, pool_id, technician_id, scheduled_date, route_order, status, job_type)
VALUES
    -- Today's run sheet (2 jobs)
    (v_job1_id, v_company_id, v_pool1_id, v_tech1_id, current_date, 1, 'pending',     'routine_service'),
    (v_job2_id, v_company_id, v_pool2_id, v_tech1_id, current_date, 2, 'in_progress', 'routine_service'),
    -- Tomorrow (schedule preview)
    (v_job3_id, v_company_id, v_pool1_id, v_tech1_id, current_date + 1, 1, 'pending', 'routine_service'),
    (v_job4_id, v_company_id, v_pool2_id, v_tech1_id, current_date + 1, 2, 'pending', 'routine_service')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SERVICE RECORD (completed job with flagged reading)
-- Linked to a separate completed job so job2 can stay in_progress.
-- ============================================================

-- Insert the completed job first
INSERT INTO jobs (id, company_id, pool_id, technician_id, scheduled_date,
                  route_order, status, job_type, completed_at)
VALUES (
    '10000000-0000-0000-0000-000000000005',
    v_company_id, v_pool1_id, v_tech1_id,
    current_date - 7, 1, 'complete', 'routine_service',
    (now() - interval '7 days')
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO service_records (
    id, ref, job_id, pool_id, company_id, technician_id, customer_id,
    completed_at, duration_seconds, readings, lsi_score, lsi_label,
    treatments, photo_urls, customer_note, is_flagged, flagged_readings, locked
)
VALUES (
    v_service_record_id,
    'SR-2026-0001',
    '10000000-0000-0000-0000-000000000005',
    v_pool1_id, v_company_id, v_tech1_id, v_customer1_id,
    now() - interval '7 days',
    2340,
    '{
        "ph":         {"value": 7.1, "status": "low"},
        "chlorine":   {"value": 0.4, "status": "low"},
        "alkalinity": {"value": 95,  "status": "good"},
        "calcium":    {"value": 280, "status": "good"},
        "stabiliser": {"value": 35,  "status": "good"}
    }'::jsonb,
    -0.45,
    'Corrosive',
    '[
        {"product_id": "f0000000-0000-0000-0000-000000000001",
         "product_name": "Liquid Chlorine", "unit": "L",
         "recommended": 2.5, "actual": 2.5},
        {"product_id": "f0000000-0000-0000-0000-000000000003",
         "product_name": "Alkalinity Increaser", "unit": "kg",
         "recommended": 0, "actual": 0}
    ]'::jsonb,
    '{"before": null, "after": null, "additional": []}'::jsonb,
    'Water looked a bit dull.',
    true,
    ARRAY['ph', 'chlorine'],
    true
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- BOOKING REQUEST + INBOX ITEMS
-- ============================================================

INSERT INTO booking_requests (id, customer_id, company_id, pool_id, reason, description, status)
VALUES (
    v_booking_id,
    v_customer1_id, v_company_id, v_pool1_id,
    'water_issue',
    'Water has gone green after heavy rain — need urgent visit.',
    'pending'
)
ON CONFLICT (id) DO NOTHING;

-- Inbox: booking request
INSERT INTO inbox_items (id, company_id, type, reference_id, customer_id, resolved)
VALUES (
    v_inbox_booking_id,
    v_company_id, 'booking_request', v_booking_id, v_customer1_id, false
)
ON CONFLICT (id) DO NOTHING;

-- Inbox: flagged reading from service record above
INSERT INTO inbox_items (id, company_id, type, reference_id, customer_id, resolved)
VALUES (
    v_inbox_flagged_id,
    v_company_id, 'flagged_reading', v_service_record_id, v_customer1_id, false
)
ON CONFLICT (id) DO NOTHING;

RAISE NOTICE '✓ E2E seed complete. Test credentials:';
RAISE NOTICE '  admin@poolops-test.com  / TestPassword123!  (admin)';
RAISE NOTICE '  tech1@poolops-test.com  / TestPassword123!  (technician — has jobs)';
RAISE NOTICE '  tech2@poolops-test.com  / TestPassword123!  (technician — fresh)';
RAISE NOTICE '  owner@poolops-test.com  / TestPassword123!  (pool owner)';

END $$;
