import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

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
      .select('id, name, email, phone, plan')
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

  const { data: usersData, error: usersErr } = await supabaseAdmin.auth.admin.listUsers();
  if (usersErr) return null;

  const matched = usersData?.users?.find(
    (u) => u?.user_metadata?.invite_token === inviteToken,
  );

  if (!matched) return null;
  return {
    kind: 'technician_or_other',
    userId: matched.id,
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
