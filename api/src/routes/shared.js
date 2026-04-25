import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { authedRateLimit } from '../middleware/rateLimit.js';
import { stub } from './stubs.js';

const router = Router();
router.use(requireAuth, authedRateLimit);

router.get('/health', stub('get', '/shared/health'));
router.get('/notifications', stub('get', '/shared/notifications'));

export default router;
