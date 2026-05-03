import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { authedRateLimit } from '../middleware/rateLimit.js';
import { ok, created, fail } from '../utils/response.js';
import {
  getTodaysJobs,
  getJobDetail,
  startJob,
  completeJob,
  uploadJobPhoto,
} from '../services/technician.service.js';
import { supabase } from '../lib/supabase.js';

const router = Router();
router.use(requireAuth, authedRateLimit, requireRole('technician'));

router.get('/jobs', async (req, res) => {
  try {
    const date = typeof req.query.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.query.date)
      ? req.query.date
      : new Date().toISOString().split('T')[0];
    const jobs = await getTodaysJobs(req.user.id, date);
    return ok(res, jobs);
  } catch (err) {
    console.error('GET /technician/jobs', err);
    return fail(res, 500, 'INTERNAL_ERROR', err.message);
  }
});

router.get('/jobs/:id', async (req, res) => {
  try {
    const job = await getJobDetail(req.params.id, req.user.id);
    return ok(res, job);
  } catch (err) {
    if (err.code === 'NOT_FOUND') return fail(res, 404, 'NOT_FOUND', err.message);
    console.error('GET /technician/jobs/:id', err);
    return fail(res, 500, 'INTERNAL_ERROR', err.message);
  }
});

router.patch('/jobs/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (status !== 'in_progress') {
      return fail(res, 400, 'VALIDATION_ERROR', 'Only status=in_progress is supported via this endpoint');
    }
    const job = await startJob(req.params.id, req.user.id);
    return ok(res, job);
  } catch (err) {
    if (err.code === 'NOT_FOUND') return fail(res, 404, 'NOT_FOUND', err.message);
    if (err.code === 'CONFLICT') return fail(res, 409, 'CONFLICT', err.message);
    console.error('PATCH /technician/jobs/:id', err);
    return fail(res, 500, 'INTERNAL_ERROR', err.message);
  }
});

router.post('/jobs/:id/photos', async (req, res) => {
  try {
    const { type, mimeType, fileName, base64 } = req.body;
    if (!type || !/^(p\d+-)?(before|after)$/.test(type)) return fail(res, 400, 'VALIDATION_ERROR', 'type must be before, after, or p{n}-before/after');
    if (!base64) return fail(res, 400, 'VALIDATION_ERROR', 'base64 is required');
    const result = await uploadJobPhoto(req.params.id, req.user.id, { type, mimeType, fileName, base64 });
    return ok(res, result);
  } catch (err) {
    if (err.code === 'NOT_FOUND') return fail(res, 404, 'NOT_FOUND', err.message);
    console.error('POST /technician/jobs/:id/photos', err);
    return fail(res, 500, 'INTERNAL_ERROR', err.message);
  }
});

router.post('/jobs/:id/complete', async (req, res) => {
  try {
    const result = await completeJob(req.params.id, req.user.id, req.body);
    return created(res, result);
  } catch (err) {
    if (err.code === 'NOT_FOUND') return fail(res, 404, 'NOT_FOUND', err.message);
    if (err.code === 'CONFLICT') return fail(res, 409, 'CONFLICT', err.message);
    console.error('POST /technician/jobs/:id/complete', err);
    return fail(res, 500, 'INTERNAL_ERROR', err.message);
  }
});

router.get('/profile', (_req, res) => fail(res, 501, 'NOT_IMPLEMENTED', 'GET /technician/profile'));
router.patch('/profile', (_req, res) => fail(res, 501, 'NOT_IMPLEMENTED', 'PATCH /technician/profile'));

router.get('/notifications', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('id, type, title, body, reference_id, read, created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return fail(res, 500, 'INTERNAL_ERROR', error.message);
    return res.status(200).json({ ok: true, data: data || [] });
  } catch (err) {
    return fail(res, 500, 'INTERNAL_ERROR', err.message);
  }
});

router.patch('/notifications/:id/read', async (req, res) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) return fail(res, 500, 'INTERNAL_ERROR', error.message);
    return res.status(200).json({ ok: true });
  } catch (err) {
    return fail(res, 500, 'INTERNAL_ERROR', err.message);
  }
});

router.patch('/notifications/read-all', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', req.user.id)
      .eq('read', false)
      .select('id');

    if (error) return fail(res, 500, 'INTERNAL_ERROR', error.message);
    return res.status(200).json({ ok: true, updated: (data || []).length });
  } catch (err) {
    return fail(res, 500, 'INTERNAL_ERROR', err.message);
  }
});

router.get('/stock', (_req, res) => fail(res, 501, 'NOT_IMPLEMENTED', 'GET /technician/stock'));

export default router;
