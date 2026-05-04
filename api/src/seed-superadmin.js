#!/usr/bin/env node
// Creates or updates simon@virtuality.co.nz as superadmin in Supabase.
// Run once: node src/seed-superadmin.js

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const EMAIL = 'simon@virtuality.co.nz';
const PASSWORD = process.argv[2];

if (!PASSWORD) {
  console.error('Usage: node src/seed-superadmin.js <password>');
  process.exit(1);
}

async function run() {
  // Check if user already exists
  const { data: list } = await supabase.auth.admin.listUsers();
  const existing = list?.users?.find(u => u.email === EMAIL);

  let userId;

  if (existing) {
    console.log('User exists — updating metadata and password...');
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: PASSWORD,
      user_metadata: { role: 'superadmin', name: 'Simon' },
    });
    if (error) throw error;
    userId = data.user.id;
  } else {
    console.log('Creating new user...');
    const { data, error } = await supabase.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { role: 'superadmin', name: 'Simon' },
    });
    if (error) throw error;
    userId = data.user.id;
  }

  // Upsert profile (no company_id for superadmin)
  const { error: profileErr } = await supabase
    .from('profiles')
    .upsert({ id: userId, email: EMAIL, full_name: 'Simon', role: 'superadmin' }, { onConflict: 'id' });

  if (profileErr) throw profileErr;

  console.log(`\nDone. Superadmin ready: ${EMAIL}`);
  console.log(`User ID: ${userId}`);
}

run().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
