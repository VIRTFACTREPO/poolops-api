import { supabase } from '../lib/supabase.js';
import { fail } from '../utils/response.js';

export async function requireActiveSubscription(req, res, next) {
  if (req.user?.role === 'superadmin') return next();

  if (req.path.startsWith('/billing')) return next();

  const companyId = req.user?.companyId;
  if (!companyId) return fail(res, 403, 'FORBIDDEN', 'No company context');

  const { data: company } = await supabase
    .from('companies')
    .select('subscription_status, trial_ends_at')
    .eq('id', companyId)
    .maybeSingle();

  if (!company) return fail(res, 403, 'FORBIDDEN', 'Company not found');

  const now = new Date();
  if (company.subscription_status === 'trialing' && new Date(company.trial_ends_at) < now) {
    return fail(res, 402, 'TRIAL_EXPIRED', 'Your 14-day trial has ended. Please upgrade to continue.');
  }
  if (company.subscription_status === 'trialing' || company.subscription_status === 'active') {
    return next();
  }
  if (company.subscription_status === 'past_due') {
    return fail(res, 402, 'PAYMENT_PAST_DUE', 'Your payment is past due. Please update your billing details.');
  }
  return fail(res, 402, 'SUBSCRIPTION_CANCELLED', 'Your subscription has been cancelled.');
}
