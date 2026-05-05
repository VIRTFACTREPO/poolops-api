import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { authedRateLimit } from '../middleware/rateLimit.js';
import { stub } from './stubs.js';
import { supabase } from '../lib/supabase.js';
import { created, fail } from '../utils/response.js';

const router = Router();
router.use(requireAuth, authedRateLimit, requireRole('pool_owner'));

router.get('/profile', stub('get', '/owner/profile'));
router.patch('/profile', stub('patch', '/owner/profile'));
router.get('/pools', stub('get', '/owner/pools'));
router.get('/jobs', stub('get', '/owner/jobs'));
router.get('/jobs/:jobId', stub('get', '/owner/jobs/:jobId'));
router.get('/service-records', stub('get', '/owner/service-records'));
router.get('/booking-requests', stub('get', '/owner/booking-requests'));
router.post('/booking-requests', async (req, res) => {
  try {
    const { pool_id = null, reason, description = null } = req.body || {};
    if (!reason) return fail(res, 422, 'VALIDATION_ERROR', 'reason is required');

    const { data: customer, error: customerErr } = await supabase
      .from('customers')
      .select('id, company_id')
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (customerErr) return fail(res, 500, 'INTERNAL_ERROR', customerErr.message);
    if (!customer) return fail(res, 404, 'NOT_FOUND', 'Linked customer not found');

    const { data: booking, error: bookingErr } = await supabase
      .from('booking_requests')
      .insert({
        company_id: customer.company_id,
        customer_id: customer.id,
        pool_id,
        reason,
        description,
      })
      .select('id')
      .single();

    if (bookingErr) return fail(res, 500, 'INTERNAL_ERROR', bookingErr.message);

    const { error: inboxErr } = await supabase
      .from('inbox_items')
      .insert({
        company_id: customer.company_id,
        customer_id: customer.id,
        type: 'booking_request',
        reference_id: booking.id,
        resolved: false,
      });

    if (inboxErr) return fail(res, 500, 'INTERNAL_ERROR', inboxErr.message);

    return created(res, { id: booking.id });
  } catch (err) {
    return fail(res, 500, 'INTERNAL_ERROR', err.message);
  }
});
router.get('/notifications', stub('get', '/owner/notifications'));
router.patch('/notifications/read-all', stub('patch', '/owner/notifications/read-all'));
router.patch('/notifications/:id/read', stub('patch', '/owner/notifications/:id/read'));
router.get('/home', stub('get', '/owner/home'));

export default router;
