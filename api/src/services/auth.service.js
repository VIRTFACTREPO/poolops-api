import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import { createStripeCustomer } from './billing.service.js';

const hasSupabase = Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY && env.SUPABASE_SERVICE_ROLE_KEY);

const supabaseAnon = hasSupabase
  ? createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, { auth: { persistSession: false } })
  : null;

const supabaseAdmin = hasSupabase
  ? createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
  : null;

function issueTokens(user) {
  const role = user?.user_metadata?.role || null;
  const companyId = user?.user_metadata?.company_id || null;
  const email = user?.email || null;

  const token = jwt.sign(
    {
      role,
      company_id: companyId,
      email,
    },
    env.JWT_SECRET,
    {
      subject: user.id,
      expiresIn: env.JWT_EXPIRES_IN,
    },
  );

  const refreshToken = jwt.sign(
    {
      type: 'refresh',
      nonce: crypto.randomBytes(8).toString('hex'),
    },
    env.JWT_SECRET,
    {
      subject: user.id,
      expiresIn: env.REFRESH_EXPIRES_IN,
    },
  );

  return { token, refreshToken, role };
}

export function assertSupabaseReady() {
  if (!hasSupabase) {
    const err = new Error('Supabase environment is not configured');
    err.code = 'SUPABASE_NOT_CONFIGURED';
    throw err;
  }
}

export async function loginWithPassword(email, password) {
  assertSupabaseReady();
  const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });
  if (error || !data?.user) {
    const err = new Error('Invalid credentials');
    err.code = 'UNAUTHORIZED';
    throw err;
  }

  const { token, refreshToken, role } = issueTokens(data.user);
  return {
    token,
    refreshToken,
    role,
    user: {
      id: data.user.id,
      email: data.user.email,
      metadata: data.user.user_metadata || {},
    },
  };
}

export async function getCurrentUserProfile(token) {
  assertSupabaseReady();

  const { data: authData, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !authData?.user) {
    const err = new Error('Unauthorized');
    err.code = 'UNAUTHORIZED';
    throw err;
  }

  const user = authData.user;
  const role = user?.user_metadata?.role || null;

  let profile = null;
  let company = null;

  const { data: profileData } = await supabaseAdmin
    .from('profiles')
    .select('id, email, role, company_id, full_name, phone, push_token, notification_prefs')
    .eq('id', user.id)
    .maybeSingle();

  profile = profileData || null;

  const companyId = profile?.company_id || user?.user_metadata?.company_id || null;
  if (companyId) {
    const { data: companyData } = await supabaseAdmin
      .from('companies')
      .select('id, name, email, phone, plan, subscription_status, trial_started_at, trial_ends_at')
      .eq('id', companyId)
      .maybeSingle();
    company = companyData || null;
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      role,
      profile,
      company,
    },
  };
}

async function findInviteTarget(inviteToken) {
  // Check customers table for owner invites
  const { data: ownerCustomer } = await supabaseAdmin
    .from('customers')
    .select('id, user_id, company_id, invite_token')
    .eq('invite_token', inviteToken)
    .maybeSingle();

  if (ownerCustomer?.user_id) {
    return {
      kind: 'owner',
      userId: ownerCustomer.user_id,
      customerId: ownerCustomer.id,
      companyId: ownerCustomer.company_id,
    };
  }

  // Look up technicians and other roles via profiles table
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('invite_token', inviteToken)
    .maybeSingle();

  if (!profile) return null;
  return {
    kind: 'technician_or_other',
    userId: profile.id,
  };
}

export async function setPasswordByInviteToken(inviteToken, password) {
  assertSupabaseReady();

  const target = await findInviteTarget(inviteToken);
  if (!target?.userId) {
    const err = new Error('Invalid or expired invite token');
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  const { data: updateData, error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(
    target.userId,
    {
      password,
      user_metadata: {
        invite_token: null,
      },
    },
  );

  if (updateErr || !updateData?.user) {
    const err = new Error('Invalid or expired invite token');
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  if (target.kind === 'owner' && target.customerId) {
    await supabaseAdmin
      .from('customers')
      .update({ invite_token: null, invite_sent_at: null })
      .eq('id', target.customerId);
  }

  // Clear invite_token from profiles for non-owner roles
  if (target.kind === 'technician_or_other') {
    await supabaseAdmin
      .from('profiles')
      .update({ invite_token: null })
      .eq('id', target.userId);
  }

  const { token, refreshToken, role } = issueTokens(updateData.user);
  return {
    token,
    refreshToken,
    role,
    user: {
      id: updateData.user.id,
      email: updateData.user.email,
      metadata: updateData.user.user_metadata || {},
    },
  };
}

export async function refreshAccessToken(refreshToken) {
  let payload;
  try {
    payload = jwt.verify(refreshToken, env.JWT_SECRET);
  } catch {
    const err = new Error('Invalid or expired refresh token');
    err.code = 'UNAUTHORIZED';
    throw err;
  }

  if (payload.type !== 'refresh' || !payload.sub) {
    const err = new Error('Invalid refresh token type');
    err.code = 'UNAUTHORIZED';
    throw err;
  }

  assertSupabaseReady();
  const { data: userData, error } = await supabaseAdmin.auth.admin.getUserById(payload.sub);
  if (error || !userData?.user) {
    const err = new Error('User not found');
    err.code = 'UNAUTHORIZED';
    throw err;
  }

  const { token, refreshToken: newRefreshToken, role } = issueTokens(userData.user);
  return { token, refreshToken: newRefreshToken, role };
}

export async function logoutFromSession(accessToken) {
  assertSupabaseReady();
  const { error } = await supabaseAdmin.auth.admin.signOut(accessToken);
  if (error) {
    const err = new Error('Logout failed');
    err.code = 'LOGOUT_FAILED';
    throw err;
  }
  return { success: true };
}

export async function forgotPassword(email) {
  if (!hasSupabase) {
    return { sent: false, mode: 'stub' };
  }

  const { error } = await supabaseAnon.auth.resetPasswordForEmail(email);
  if (error) {
    return { sent: false, mode: 'stub' };
  }

  return { sent: true, mode: env.RESEND_ENABLED ? 'resend' : 'stub' };
}

export async function signupCompany({ companyName, adminName, email, password }) {
  assertSupabaseReady();

  if (!companyName || !adminName || !email || !password) {
    const err = new Error('All fields are required');
    err.code = 'VALIDATION_ERROR';
    throw err;
  }
  if (password.length < 8) {
    const err = new Error('Password must be at least 8 characters');
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  // Step 1: Create auth user
  const { data: userData, error: userErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'admin' },
  });

  if (userErr) {
    if (
      userErr.message?.toLowerCase().includes('already been registered') ||
      userErr.message?.toLowerCase().includes('already exists') ||
      userErr.code === 'email_exists'
    ) {
      const err = new Error('An account with this email already exists');
      err.code = 'CONFLICT';
      throw err;
    }
    throw userErr;
  }

  const userId = userData.user.id;

  // Step 2: Create company
  const { data: company, error: companyErr } = await supabaseAdmin
    .from('companies')
    .insert({
      name: companyName,
      email,
      plan: 'pro',
      subscription_status: 'trialing',
      trial_started_at: new Date().toISOString(),
      trial_ends_at: new Date(Date.now() + 14 * 86400000).toISOString(),
    })
    .select('id')
    .single();

  if (companyErr) {
    await supabaseAdmin.auth.admin.deleteUser(userId).catch((e) => console.error('[signup] cleanup deleteUser failed', e));
    throw companyErr;
  }

  // Step 3: Stripe customer (non-fatal)
  try {
    await createStripeCustomer(email, companyName, company.id);
  } catch (stripeErr) {
    console.error('[signup] Stripe customer creation failed (non-fatal):', stripeErr.message);
  }

  // Step 4: Insert profile
  const { error: profileErr } = await supabaseAdmin
    .from('profiles')
    .insert({ id: userId, email, role: 'admin', company_id: company.id, full_name: adminName });

  if (profileErr) {
    await Promise.allSettled([
      supabaseAdmin.auth.admin.deleteUser(userId),
      supabaseAdmin.from('companies').delete().eq('id', company.id),
    ]).then((results) => results.forEach((r) => r.status === 'rejected' && console.error('[signup] cleanup failed', r.reason)));
    throw profileErr;
  }

  // Step 5: Update user metadata with company_id
  const { data: updatedUser, error: metaErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    user_metadata: { role: 'admin', company_id: company.id },
  });

  if (metaErr) {
    await Promise.allSettled([
      supabaseAdmin.auth.admin.deleteUser(userId),
      supabaseAdmin.from('companies').delete().eq('id', company.id),
    ]).then((results) => results.forEach((r) => r.status === 'rejected' && console.error('[signup] cleanup failed', r.reason)));
    throw metaErr;
  }

  const { token, refreshToken } = issueTokens(updatedUser.user);
  return {
    token,
    refreshToken,
    role: 'admin',
    user: { id: userId, email, name: adminName },
    company: { id: company.id, name: companyName },
  };
}

export async function createInviteForUser({ email, fullName, role, companyId, customerId }) {
  assertSupabaseReady();

  const inviteToken = crypto.randomBytes(24).toString('hex');

  const { data: { user }, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { role, company_id: companyId, invite_token: inviteToken },
  });

  if (error) {
    if (error.message?.toLowerCase().includes('already been registered')) {
      const err = new Error('Email already registered');
      err.code = 'CONFLICT';
      throw err;
    }
    throw error;
  }

  await supabaseAdmin.from('profiles').insert({
    id: user.id,
    email,
    role,
    company_id: role === 'pool_owner' ? null : companyId,
    full_name: fullName,
    invite_token: inviteToken,
  });

  if (role === 'pool_owner' && customerId) {
    await supabaseAdmin
      .from('customers')
      .update({
        user_id: user.id,
        invite_token: inviteToken,
        invite_sent_at: new Date().toISOString(),
      })
      .eq('id', customerId);
  }

  // Email invite stub — implement when RESEND_ENABLED=true
  console.log(`[invite] token for ${email}: ${inviteToken}`);

  return { inviteToken, userId: user.id };
}
