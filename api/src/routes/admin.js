import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { authedRateLimit } from '../middleware/rateLimit.js';
import { requireActiveSubscription } from '../middleware/subscriptionGuard.js';
import { checkTechnicianLimit, checkPoolLimit } from '../middleware/planEnforcement.js';
import { ok, fail } from '../utils/response.js';
import { createInviteForUser } from '../services/auth.service.js';
import {
  getBillingStatus,
  createCheckoutSession,
  createBillingPortalSession,
} from '../services/billing.service.js';
import { supabase } from '../lib/supabase.js';
import { stub } from './stubs.js';

const router = Router();
router.use(requireAuth, authedRateLimit, requireRole('admin'), requireActiveSubscription);

router.get('/dashboard', stub('get', '/admin/dashboard'));
router.get('/customers', stub('get', '/admin/customers'));

router.get('/customers/:id', async (req, res) => {
  try {
    const param = req.params.id;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(param);
    const isNumber = /^\d+$/.test(param);
    if (!isUuid && !isNumber) return fail(res, 400, 'BAD_REQUEST', 'Invalid customer identifier');

    const baseQuery = supabase
      .from('customers')
      .select(`
        id, company_id, first_name, last_name, email, phone, address, active, created_at,
        pools (
          id, volume_litres, pool_type, surface_type, equipment_notes, gate_access, warnings,
          service_plans (
            id, frequency, day_of_week, active, technician_id
          )
        )
      `)
      .eq('company_id', req.user.companyId);

    const { data: customer, error } = await (
      isUuid ? baseQuery.eq('id', param) : baseQuery.eq('customer_number', Number(param))
    ).maybeSingle();
    if (error) return fail(res, 500, 'INTERNAL_ERROR', error.message);
    if (!customer) return fail(res, 404, 'NOT_FOUND', 'Customer not found');

    // Collect unique technician IDs across all pools/plans, then batch-fetch names
    const techIds = [
      ...new Set(
        (customer.pools ?? [])
          .flatMap((p) => (p.service_plans ?? []).map((sp) => sp.technician_id))
          .filter(Boolean),
      ),
    ];

    let techMap = {};
    if (techIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', techIds);
      techMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name]));
    }

    // Attach technician object to each plan (mirrors the old joined shape)
    const enriched = {
      ...customer,
      pools: (customer.pools ?? []).map((pool) => ({
        ...pool,
        service_plans: (pool.service_plans ?? []).map((sp) => ({
          ...sp,
          technician: sp.technician_id ? { full_name: techMap[sp.technician_id] ?? null } : null,
        })),
      })),
    };

    return ok(res, enriched);
  } catch (err) {
    return fail(res, 500, 'INTERNAL_ERROR', err.message);
  }
});
router.post('/jobs', stub('post', '/admin/jobs'));
router.get('/inbox', stub('get', '/admin/inbox'));
router.patch('/inbox/:id', stub('patch', '/admin/inbox/:id'));
router.get('/audit-log', stub('get', '/admin/audit-log'));

// Plan-enforced creation endpoints
router.post('/technicians', checkTechnicianLimit, stub('post', '/admin/technicians'));
router.post('/pools', checkPoolLimit, stub('post', '/admin/pools'));

// Invite a technician or pool owner
router.post('/invite', async (req, res) => {
  try {
    const { email, fullName, role, customerId } = req.body || {};
    if (!email || !fullName || !['technician', 'pool_owner'].includes(role)) {
      return fail(res, 422, 'VALIDATION_ERROR', 'email, fullName, and role (technician|pool_owner) are required');
    }
    const result = await createInviteForUser({
      email,
      fullName,
      role,
      companyId: req.user.companyId,
      customerId: customerId || null,
    });
    return ok(res, result);
  } catch (err) {
    if (err?.code === 'CONFLICT') return fail(res, 409, 'CONFLICT', err.message);
    console.error('POST /admin/invite', err);
    return fail(res, 500, 'INTERNAL_ERROR', err.message);
  }
});

// Billing routes — requireActiveSubscription exempts /billing/* paths itself
router.get('/billing/status', async (req, res) => {
  try {
    const { data: company, error } = await supabase
      .from('companies')
      .select('id, plan, subscription_status, trial_started_at, trial_ends_at')
      .eq('id', req.user.companyId)
      .maybeSingle();
    if (error || !company) return fail(res, 404, 'NOT_FOUND', 'Company not found');
    return ok(res, getBillingStatus(company));
  } catch (err) {
    return fail(res, 500, 'INTERNAL_ERROR', err.message);
  }
});

router.post('/billing/checkout', async (req, res) => {
  try {
    const { data: company, error } = await supabase
      .from('companies')
      .select('id, plan, stripe_customer_id')
      .eq('id', req.user.companyId)
      .maybeSingle();
    if (error || !company) return fail(res, 404, 'NOT_FOUND', 'Company not found');
    const result = await createCheckoutSession(company);
    return ok(res, result);
  } catch (err) {
    return fail(res, 500, 'INTERNAL_ERROR', err.message);
  }
});

router.post('/billing/portal', async (req, res) => {
  try {
    const { data: company, error } = await supabase
      .from('companies')
      .select('id, stripe_customer_id')
      .eq('id', req.user.companyId)
      .maybeSingle();
    if (error || !company) return fail(res, 404, 'NOT_FOUND', 'Company not found');
    const result = await createBillingPortalSession(company);
    return ok(res, result);
  } catch (err) {
    return fail(res, 500, 'INTERNAL_ERROR', err.message);
  }
});

export default router;
