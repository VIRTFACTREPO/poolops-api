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
import { insertNotification } from '../services/technician.service.js';

const router = Router();
router.use(requireAuth, authedRateLimit, requireRole('admin'), requireActiveSubscription);
router.use((req, res, next) => {
  if (!req.user.companyId) return fail(res, 403, 'FORBIDDEN', 'No company associated with this account');
  next();
});

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
        id, company_id, customer_number, first_name, last_name, email, phone, address, active, created_at,
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
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const techIds = [
      ...new Set(
        (customer.pools ?? [])
          .flatMap((p) => (p.service_plans ?? []).map((sp) => sp.technician_id))
          .filter((id) => id && UUID_RE.test(id)),
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

router.patch('/jobs/:id/reassign', async (req, res) => {
  try {
    const { technicianId } = req.body || {};
    if (!technicianId) return fail(res, 422, 'VALIDATION_ERROR', 'technicianId is required');

    const { data: existing, error: fetchErr } = await supabase
      .from('jobs')
      .select('id, technician_id, company_id')
      .eq('id', req.params.id)
      .eq('company_id', req.user.companyId)
      .maybeSingle();

    if (fetchErr) return fail(res, 500, 'INTERNAL_ERROR', fetchErr.message);
    if (!existing) return fail(res, 404, 'NOT_FOUND', 'Job not found');

    const previousTechnicianId = existing.technician_id || null;

    const { data: updated, error: updateErr } = await supabase
      .from('jobs')
      .update({ technician_id: technicianId })
      .eq('id', req.params.id)
      .eq('company_id', req.user.companyId)
      .select('id, technician_id')
      .single();

    if (updateErr) return fail(res, 500, 'INTERNAL_ERROR', updateErr.message);

    try {
      await insertNotification({
        userId: technicianId,
        type: 'schedule_change',
        title: 'Schedule updated',
        body: 'A job has been assigned to you.',
        referenceId: req.params.id,
      });
      if (previousTechnicianId && previousTechnicianId !== technicianId) {
        await insertNotification({
          userId: previousTechnicianId,
          type: 'schedule_change',
          title: 'Schedule updated',
          body: 'A job has been reassigned from your schedule.',
          referenceId: req.params.id,
        });
      }
    } catch (err) {
      console.error('[admin.reassign] notification trigger failed', err?.message || err);
    }

    return ok(res, updated);
  } catch (err) {
    return fail(res, 500, 'INTERNAL_ERROR', err.message);
  }
});

router.get('/inbox', stub('get', '/admin/inbox'));
router.patch('/inbox/:id', stub('patch', '/admin/inbox/:id'));

router.post('/inbox/:id/confirm-visit', async (req, res) => {
  try {
    const { technicianId, scheduledDate, routeOrder = 1 } = req.body || {};
    if (!technicianId || !scheduledDate) {
      return fail(res, 422, 'VALIDATION_ERROR', 'technicianId and scheduledDate are required');
    }

    const { data: inboxItem, error: inboxErr } = await supabase
      .from('inbox_items')
      .select('id, customer_id, company_id')
      .eq('id', req.params.id)
      .eq('company_id', req.user.companyId)
      .maybeSingle();

    if (inboxErr) return fail(res, 500, 'INTERNAL_ERROR', inboxErr.message);
    if (!inboxItem) return fail(res, 404, 'NOT_FOUND', 'Inbox item not found');

    const { data: pools, error: poolsErr } = await supabase
      .from('pools')
      .select('id')
      .eq('customer_id', inboxItem.customer_id)
      .eq('company_id', req.user.companyId)
      .limit(1);

    if (poolsErr) return fail(res, 500, 'INTERNAL_ERROR', poolsErr.message);
    if (!pools || pools.length === 0) return fail(res, 422, 'VALIDATION_ERROR', 'Customer has no pools');

    const { data: job, error: jobErr } = await supabase
      .from('jobs')
      .insert({
        company_id: req.user.companyId,
        technician_id: technicianId,
        scheduled_date: scheduledDate,
        route_order: routeOrder,
        status: 'pending',
        job_type: 'routine_service',
        created_by: req.user.id,
      })
      .select('id')
      .single();

    if (jobErr) return fail(res, 500, 'INTERNAL_ERROR', jobErr.message);

    const { error: jpErr } = await supabase
      .from('job_pools')
      .insert({ job_id: job.id, pool_id: pools[0].id });
    if (jpErr) return fail(res, 500, 'INTERNAL_ERROR', jpErr.message);

    await supabase
      .from('inbox_items')
      .update({ status: 'confirmed' })
      .eq('id', req.params.id)
      .eq('company_id', req.user.companyId);

    try {
      const { data: customer } = await supabase
        .from('customers')
        .select('user_id')
        .eq('id', inboxItem.customer_id)
        .maybeSingle();
      if (customer?.user_id) {
        await insertNotification({
          userId: customer.user_id,
          type: 'visit_confirmed',
          title: 'Visit confirmed',
          body: 'Your requested visit has been confirmed.',
          referenceId: job.id,
        });
      }
    } catch (err) {
      console.error('[admin.confirm-visit] notification trigger failed', err?.message || err);
    }

    return ok(res, { jobId: job.id });
  } catch (err) {
    return fail(res, 500, 'INTERNAL_ERROR', err.message);
  }
});

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
