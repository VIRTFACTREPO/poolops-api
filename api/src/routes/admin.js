import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { authedRateLimit } from '../middleware/rateLimit.js';
import { stub } from './stubs.js';

const router = Router();
router.use(requireAuth, authedRateLimit, requireRole('admin'));

router.get('/dashboard', stub('get', '/admin/dashboard'));
router.get('/customers', stub('get', '/admin/customers'));
router.post('/jobs', stub('post', '/admin/jobs'));
router.get('/inbox', stub('get', '/admin/inbox'));
router.patch('/inbox/:id', stub('patch', '/admin/inbox/:id'));
router.get('/audit-log', stub('get', '/admin/audit-log'));

export default router;
