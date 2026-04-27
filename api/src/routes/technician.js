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

function extractToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

router.get('/jobs', async (req, res) => {
  try {
    const jobs = await getTodaysJobs(extractToken(req));
    return ok(res, jobs);
  } catch (err) {
    console.error('GET /technician/jobs', err);
    return fail(res, 500, 'INTERNAL_ERROR', err.message);
  }
});

router.get('/jobs/:id', async (req, res) => {
  try {
    const job = await getJobDetail(req.params.id, extractToken(req));
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
    const job = await startJob(req.params.id, extractToken(req));
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
    const result = await completeJob(req.params.id, req.user.id, extractToken(req), req.body);
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
router.get('/notifications', (_req, res) => fail(res, 501, 'NOT_IMPLEMENTED', 'GET /technician/notifications'));
router.patch('/notifications/:id/read', (_req, res) => fail(res, 501, 'NOT_IMPLEMENTED', 'PATCH /technician/notifications/:id/read'));
router.get('/stock', (_req, res) => fail(res, 501, 'NOT_IMPLEMENTED', 'GET /technician/stock'));

export default router;
