import { Router } from 'express';
import { stub } from './stubs.js';

const router = Router();

router.post('/stripe', stub('post', '/webhooks/stripe'));
router.post('/resend', stub('post', '/webhooks/resend'));

export default router;
