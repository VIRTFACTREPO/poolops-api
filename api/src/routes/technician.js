import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { authedRateLimit } from '../middleware/rateLimit.js';
import { ok, created, fail } from '../utils/response.js';
import {
  getTodaysJobs,
  getJobDetail,
  startJob,
  completeJob,
} from '../services/technician.service.js';

const router = Router();
router.use(requireAuth, authedRateLimit, requireRole('technician'));

router.get('/jobs', async (req, res) => {
  try {
    const jobs = await getTodaysJobs(req.user.id);
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

router.get('/profile', async (req, res) => {
  return fail(res, 501, 'NOT_IMPLEMENTED', 'GET /technician/profile not yet implemented');
});

router.patch('/profile', async (req, res) => {
  return fail(res, 501, 'NOT_IMPLEMENTED', 'PATCH /technician/profile not yet implemented');
});

router.get('/notifications', async (req, res) => {
  return fail(res, 501, 'NOT_IMPLEMENTED', 'GET /technician/notifications not yet implemented');
});

router.patch('/notifications/:id/read', async (req, res) => {
  return fail(res, 501, 'NOT_IMPLEMENTED', 'PATCH /technician/notifications/:id/read not yet implemented');
});

router.get('/stock', async (req, res) => {
  return fail(res, 501, 'NOT_IMPLEMENTED', 'GET /technician/stock not yet implemented');
});

export default router;
