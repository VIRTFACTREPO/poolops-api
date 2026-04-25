import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { authedRateLimit } from '../middleware/rateLimit.js';
import { stub } from './stubs.js';

const router = Router();
router.use(requireAuth, authedRateLimit, requireRole('technician'));

router.get('/jobs', stub('get', '/technician/jobs'));
router.patch('/jobs/:id', stub('patch', '/technician/jobs/:id'));
router.get('/profile', stub('get', '/technician/profile'));
router.patch('/profile', stub('patch', '/technician/profile'));
router.get('/notifications', stub('get', '/technician/notifications'));
router.patch('/notifications/:id/read', stub('patch', '/technician/notifications/:id/read'));
router.get('/stock', stub('get', '/technician/stock'));

export default router;
