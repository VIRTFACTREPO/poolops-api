#!/usr/bin/env node
// Creates the 4 E2E test auth users in Supabase Cloud using the Admin API.
// Uses the same stable UUIDs as seed_e2e.sql so the SQL runs without changes.
//
// Usage:
//   SUPABASE_URL=https://xxx.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
//   node supabase/create_e2e_auth_users.js

import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
    console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
    process.exit(1);
}

const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

const users = [
    { id: 'b0000000-0000-0000-0000-000000000001', email: 'admin@poolops-test.com',  role: 'admin'      },
    { id: 'b0000000-0000-0000-0000-000000000002', email: 'tech1@poolops-test.com',  role: 'technician' },
    { id: 'b0000000-0000-0000-0000-000000000003', email: 'tech2@poolops-test.com',  role: 'technician' },
    { id: 'b0000000-0000-0000-0000-000000000004', email: 'owner@poolops-test.com',  role: 'pool_owner' },
];

const PASSWORD = 'TestPassword123!';

for (const u of users) {
    const { data, error } = await supabase.auth.admin.createUser({
        user_id: u.id,
        email: u.email,
        password: PASSWORD,
        email_confirm: true,
    });

    if (error) {
        if (error.message?.includes('already been registered')) {
            console.log(`  skip  ${u.email} (already exists)`);
        } else {
            console.error(`  error ${u.email}: ${error.message}`);
        }
    } else {
        console.log(`  created ${u.email}  (${data.user.id})`);
    }
}

console.log('\nAll done. Now run seed_e2e.sql — skip the auth.users INSERT block at the top.');
