import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { authedRateLimit } from '../middleware/rateLimit.js';
import { stub } from './stubs.js';

const router = Router();
router.use(requireAuth, authedRateLimit, requireRole('pool_owner'));

router.get('/profile', stub('get', '/owner/profile'));
router.patch('/profile', stub('patch', '/owner/profile'));
router.get('/pools', stub('get', '/owner/pools'));
router.get('/jobs', stub('get', '/owner/jobs'));
router.get('/jobs/:jobId', stub('get', '/owner/jobs/:jobId'));
router.get('/service-records', stub('get', '/owner/service-records'));
router.get('/booking-requests', stub('get', '/owner/booking-requests'));
router.post('/booking-requests', stub('post', '/owner/booking-requests'));
router.get('/notifications', stub('get', '/owner/notifications'));
router.patch('/notifications/:id/read', stub('patch', '/owner/notifications/:id/read'));

export default router;
