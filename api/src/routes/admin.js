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
          id, volume_litres, pool_type, pool_category, surface_type, equipment_notes, gate_access, warnings,
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

router.get('/customers/:id/records', async (req, res) => {
  try {
    const param = req.params.id;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(param);
    const isNumber = /^\d+$/.test(param);
    if (!isUuid && !isNumber) return fail(res, 400, 'BAD_REQUEST', 'Invalid customer identifier');

    // Resolve customer UUID
    const { data: customer, error: custErr } = await (
      isUuid
        ? supabase.from('customers').select('id').eq('id', param).eq('company_id', req.user.companyId)
        : supabase.from('customers').select('id').eq('customer_number', Number(param)).eq('company_id', req.user.companyId)
    ).maybeSingle();
    if (custErr) return fail(res, 500, 'INTERNAL_ERROR', custErr.message);
    if (!customer) return fail(res, 404, 'NOT_FOUND', 'Customer not found');

    // Query service_records directly via customer_id FK
    const { data: records, error: recErr } = await supabase
      .from('service_records')
      .select('id, job_id, completed_at, is_flagged, readings, treatments, technician_id, jobs(scheduled_date)')
      .eq('customer_id', customer.id)
      .order('completed_at', { ascending: false })
      .limit(50);
    if (recErr) return fail(res, 500, 'INTERNAL_ERROR', recErr.message);

    // Batch fetch technician names
    const techIds = [...new Set((records ?? []).map((r) => r.technician_id).filter(Boolean))];
    let techMap = {};
    if (techIds.length > 0) {
      const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', techIds);
      techMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name]));
    }

    const result = (records ?? []).map((r) => ({
      id: r.id,
      jobId: r.job_id,
      completedAt: r.completed_at,
      scheduledDate: r.jobs?.scheduled_date ?? null,
      isFlagged: r.is_flagged,
      technician: techMap[r.technician_id] ?? null,
      readings: r.readings,
      treatments: r.treatments,
    }));

    return ok(res, result);
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

router.get('/inbox', async (req, res) => {
  try {
    const { data: items, error } = await supabase
      .from('inbox_items')
      .select(`
        id, type, resolved, created_at, reference_id,
        customer:customers(id, first_name, last_name, address)
      `)
      .eq('company_id', req.user.companyId)
      .order('created_at', { ascending: false });

    if (error) return fail(res, 500, 'INTERNAL_ERROR', error.message);

    const bookingIds = items.filter(i => i.type === 'booking_request').map(i => i.reference_id);
    const flaggedIds = items.filter(i => i.type === 'flagged_reading').map(i => i.reference_id);

    const [bookingsRes, recordsRes] = await Promise.all([
      bookingIds.length
        ? supabase.from('booking_requests').select('id, reason, description, photo_url, status, pool_id').in('id', bookingIds)
        : { data: [] },
      flaggedIds.length
        ? supabase.from('service_records').select('id, readings, completed_at, technician_id').in('id', flaggedIds)
        : { data: [] },
    ]);

    const bookingMap = Object.fromEntries((bookingsRes.data || []).map(b => [b.id, b]));
    const recordMap = Object.fromEntries((recordsRes.data || []).map(r => [r.id, r]));

    const result = items.map(item => ({
      ...item,
      booking: item.type === 'booking_request' ? (bookingMap[item.reference_id] ?? null) : undefined,
      record: item.type === 'flagged_reading' ? (recordMap[item.reference_id] ?? null) : undefined,
    }));

    return ok(res, result);
  } catch (err) {
    return fail(res, 500, 'INTERNAL_ERROR', err.message);
  }
});

router.patch('/inbox/:id', async (req, res) => {
  try {
    const { resolved } = req.body || {};
    const { error } = await supabase
      .from('inbox_items')
      .update({ resolved: !!resolved, resolved_at: resolved ? new Date().toISOString() : null })
      .eq('id', req.params.id)
      .eq('company_id', req.user.companyId);

    if (error) return fail(res, 500, 'INTERNAL_ERROR', error.message);
    return ok(res, { ok: true });
  } catch (err) {
    return fail(res, 500, 'INTERNAL_ERROR', err.message);
  }
});

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

router.get('/technicians/:id', async (req, res) => {
  try {
    const techId = req.params.id;

    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('id, full_name, role, phone')
      .eq('id', techId)
      .eq('company_id', req.user.companyId)
      .eq('role', 'technician')
      .maybeSingle();
    if (profileErr) return fail(res, 500, 'INTERNAL_ERROR', profileErr.message);
    if (!profile) return fail(res, 404, 'NOT_FOUND', 'Technician not found');

    let email = null;
    try {
      const { data: authUser } = await supabase.auth.admin.getUserById(techId);
      email = authUser?.user?.email ?? null;
    } catch { /* email optional */ }

    const today = new Date().toISOString().slice(0, 10);
    const [{ data: todayJobs }, { data: plans }, { data: recentRecords }] = await Promise.all([
      supabase
        .from('jobs')
        .select('id, status, job_pools(pools(customers(first_name, last_name, address)))')
        .eq('technician_id', techId)
        .eq('company_id', req.user.companyId)
        .eq('scheduled_date', today),
      supabase
        .from('service_plans')
        .select('id, frequency, day_of_week, pools(customers(id, first_name, last_name, address, customer_number))')
        .eq('technician_id', techId)
        .eq('active', true),
      supabase
        .from('service_records')
        .select('id, completed_at, is_flagged, customers(first_name, last_name, address)')
        .eq('technician_id', techId)
        .order('completed_at', { ascending: false })
        .limit(8),
    ]);

    return ok(res, {
      id: profile.id,
      name: profile.full_name,
      email,
      phone: profile.phone ?? null,
      today: {
        assigned: (todayJobs ?? []).length,
        completed: (todayJobs ?? []).filter((j) => j.status === 'complete').length,
        jobs: (todayJobs ?? []).map((j) => {
          const pool = (j.job_pools ?? [])[0]?.pools;
          const c = pool?.customers;
          return { id: j.id, status: j.status, customer: c ? `${c.last_name}, ${c.first_name}` : null, address: c?.address ?? null };
        }),
      },
      assignments: (plans ?? []).map((sp) => ({
        id: sp.id,
        frequency: sp.frequency,
        dayOfWeek: sp.day_of_week,
        customer: sp.pools?.customers ? `${sp.pools.customers.last_name}, ${sp.pools.customers.first_name}` : null,
        customerNumber: sp.pools?.customers?.customer_number ?? null,
        address: sp.pools?.customers?.address ?? null,
      })),
      recentRecords: (recentRecords ?? []).map((r) => ({
        id: r.id,
        completedAt: r.completed_at,
        isFlagged: r.is_flagged,
        customer: r.customers ? `${r.customers.last_name}, ${r.customers.first_name}` : null,
        address: r.customers?.address ?? null,
      })),
    });
  } catch (err) {
    return fail(res, 500, 'INTERNAL_ERROR', err.message);
  }
});


router.patch('/technicians/:id', async (req, res) => {
  try {
    const techId = req.params.id;
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';

    if (!name || !email) {
      return fail(res, 422, 'VALIDATION_ERROR', 'name and email are required');
    }

    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', techId)
      .eq('company_id', req.user.companyId)
      .maybeSingle();

    if (profileErr) return fail(res, 500, 'INTERNAL_ERROR', profileErr.message);
    if (!profile) return fail(res, 404, 'NOT_FOUND', 'Technician not found');
    if (profile.role !== 'technician') return fail(res, 403, 'FORBIDDEN', 'Cannot edit non-technician profiles');

    const { error: updateProfileErr } = await supabase
      .from('profiles')
      .update({ full_name: name, email, phone: phone || null })
      .eq('id', techId)
      .eq('company_id', req.user.companyId);

    if (updateProfileErr) return fail(res, 500, 'INTERNAL_ERROR', updateProfileErr.message);

    const { error: updateAuthErr } = await supabase.auth.admin.updateUserById(techId, {
      email,
      user_metadata: { full_name: name, phone: phone || null },
    });

    if (updateAuthErr) {
      return fail(res, 500, 'INTERNAL_ERROR', updateAuthErr.message);
    }

    return ok(res, { id: techId, name, email, phone: phone || null });
  } catch (err) {
    return fail(res, 500, 'INTERNAL_ERROR', err.message);
  }
});

// Plan-enforced creation endpoints
router.post('/technicians', checkTechnicianLimit, stub('post', '/admin/technicians'));
router.post('/pools', checkPoolLimit, async (req, res) => {
  try {
    const { customer_id, pool_category, volume_litres, pool_type, gate_access, site_notes } = req.body || {};
    if (!customer_id || !volume_litres || !pool_type) {
      return fail(res, 422, 'VALIDATION_ERROR', 'customer_id, volume_litres, and pool_type are required');
    }
    const volume = Number(volume_litres);
    if (!Number.isFinite(volume) || volume <= 0) {
      return fail(res, 422, 'VALIDATION_ERROR', 'volume_litres must be a positive number');
    }
    const category = pool_category === 'spa' ? 'spa' : 'pool';

    const { data: customer, error: custErr } = await supabase
      .from('customers')
      .select('id')
      .eq('id', customer_id)
      .eq('company_id', req.user.companyId)
      .maybeSingle();
    if (custErr) return fail(res, 500, 'INTERNAL_ERROR', custErr.message);
    if (!customer) return fail(res, 404, 'NOT_FOUND', 'Customer not found');

    const { count: poolCount, error: countErr } = await supabase
      .from('pools')
      .select('id', { count: 'exact', head: true })
      .eq('customer_id', customer_id);
    if (countErr) return fail(res, 500, 'INTERNAL_ERROR', countErr.message);
    if (poolCount >= 2) return fail(res, 422, 'LIMIT_EXCEEDED', 'Customers are limited to 2 pools');

    const { data: pool, error: insertErr } = await supabase
      .from('pools')
      .insert({
        customer_id,
        company_id: req.user.companyId,
        pool_category: category,
        volume_litres: volume,
        pool_type,
        gate_access: gate_access || null,
        warnings: site_notes || null,
      })
      .select()
      .single();
    if (insertErr) return fail(res, 500, 'INTERNAL_ERROR', insertErr.message);
    return ok(res, pool);
  } catch (err) {
    return fail(res, 500, 'INTERNAL_ERROR', err.message);
  }
});

// Invite a technician or pool owner
router.post('/invite', async (req, res) => {
  try {
    const { email, fullName, role, customerId } = req.body || {};
    if (!email || !fullName || !['technician', 'pool_owner'].includes(role)) {
      return fail(res, 422, 'VALIDATION_ERROR', 'email, fullName, and role (technician|pool_owner) are required');
    }

    if (role === 'technician') {
      const TECH_LIMITS = { solo: 1, pro: 3, business: Infinity };
      const { data: company } = await supabase.from('companies').select('plan').eq('id', req.user.companyId).maybeSingle();
      const plan = company?.plan || 'solo';
      const limit = TECH_LIMITS[plan] ?? 1;
      if (limit !== Infinity) {
        const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('company_id', req.user.companyId).eq('role', 'technician');
        if ((count ?? 0) >= limit) {
          return fail(res, 403, 'PLAN_LIMIT_EXCEEDED', `Your ${plan} plan allows a maximum of ${limit} technician${limit === 1 ? '' : 's'}. Upgrade your plan to add more.`);
        }
      }
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

router.delete('/technicians/:id', async (req, res) => {
  try {
    const techId = req.params.id;
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', techId)
      .eq('company_id', req.user.companyId)
      .maybeSingle();
    if (profileErr) return fail(res, 500, 'INTERNAL_ERROR', profileErr.message);
    if (!profile) return fail(res, 404, 'NOT_FOUND', 'Technician not found');
    if (profile.role !== 'technician') return fail(res, 403, 'FORBIDDEN', 'Cannot delete non-technician profiles');

    await supabase.from('service_plans').update({ technician_id: null }).eq('technician_id', techId).eq('company_id', req.user.companyId);
    await supabase.from('jobs').update({ technician_id: null }).eq('technician_id', techId).eq('company_id', req.user.companyId);
    await supabase.from('profiles').delete().eq('id', techId).eq('company_id', req.user.companyId);
    await supabase.auth.admin.deleteUser(techId);

    return ok(res, { ok: true });
  } catch (err) {
    return fail(res, 500, 'INTERNAL_ERROR', err.message);
  }
});

router.patch('/customers/:id', async (req, res) => {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
    const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
    const address = typeof req.body?.address === 'string' ? req.body.address.trim() : '';

    if (!name || !email || !address) {
      return fail(res, 422, 'VALIDATION_ERROR', 'name, email, and address are required');
    }

    const [firstName, ...rest] = name.split(/\s+/).filter(Boolean);
    const lastName = rest.join(' ') || '-';

    const { data: customer, error: fetchErr } = await supabase
      .from('customers')
      .select('id')
      .eq('id', req.params.id)
      .eq('company_id', req.user.companyId)
      .maybeSingle();
    if (fetchErr) return fail(res, 500, 'INTERNAL_ERROR', fetchErr.message);
    if (!customer) return fail(res, 404, 'NOT_FOUND', 'Customer not found');

    const { error: updateErr } = await supabase
      .from('customers')
      .update({
        first_name: firstName,
        last_name: lastName,
        email,
        phone: phone || null,
        address,
      })
      .eq('id', req.params.id)
      .eq('company_id', req.user.companyId);

    if (updateErr) return fail(res, 500, 'INTERNAL_ERROR', updateErr.message);
    return ok(res, { id: req.params.id, name, email, phone: phone || null, address });
  } catch (err) {
    return fail(res, 500, 'INTERNAL_ERROR', err.message);
  }
});

router.patch('/pools/:id', async (req, res) => {
  try {
    const volume = Number(req.body?.volume);
    const type = typeof req.body?.type === 'string' ? req.body.type.trim() : '';
    const gateAccess = typeof req.body?.gate_access === 'string' ? req.body.gate_access.trim() : '';
    const siteNotes = typeof req.body?.site_notes === 'string' ? req.body.site_notes.trim() : '';
    const poolCategory = req.body?.pool_category === 'spa' ? 'spa' : 'pool';

    if (!Number.isFinite(volume) || volume <= 0 || !type) {
      return fail(res, 422, 'VALIDATION_ERROR', 'volume and type are required');
    }

    const { data: pool, error: fetchErr } = await supabase
      .from('pools')
      .select('id, company_id')
      .eq('id', req.params.id)
      .eq('company_id', req.user.companyId)
      .maybeSingle();

    if (fetchErr) return fail(res, 500, 'INTERNAL_ERROR', fetchErr.message);
    if (!pool) return fail(res, 404, 'NOT_FOUND', 'Pool not found');

    const { error: updateErr } = await supabase
      .from('pools')
      .update({
        pool_category: poolCategory,
        volume_litres: volume,
        pool_type: type,
        gate_access: gateAccess || null,
        warnings: siteNotes || null,
      })
      .eq('id', req.params.id)
      .eq('company_id', req.user.companyId);

    if (updateErr) return fail(res, 500, 'INTERNAL_ERROR', updateErr.message);
    return ok(res, { id: req.params.id, pool_category: poolCategory, volume, type, gate_access: gateAccess || null, site_notes: siteNotes || null });
  } catch (err) {
    return fail(res, 500, 'INTERNAL_ERROR', err.message);
  }
});

router.delete('/customers/:id', async (req, res) => {
  try {
    const { data: customer, error: fetchErr } = await supabase
      .from('customers')
      .select('id')
      .eq('id', req.params.id)
      .eq('company_id', req.user.companyId)
      .maybeSingle();
    if (fetchErr) return fail(res, 500, 'INTERNAL_ERROR', fetchErr.message);
    if (!customer) return fail(res, 404, 'NOT_FOUND', 'Customer not found');

    const { error: delErr } = await supabase.from('customers').delete().eq('id', req.params.id).eq('company_id', req.user.companyId);
    if (delErr) return fail(res, 500, 'INTERNAL_ERROR', delErr.message);

    return ok(res, { ok: true });
  } catch (err) {
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
