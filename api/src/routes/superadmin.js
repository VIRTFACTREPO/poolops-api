import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { ok, fail } from '../utils/response.js';
import { supabase } from '../lib/supabase.js';

const router = Router();
router.use(requireAuth, requireRole('superadmin'));

router.get('/companies', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, email, plan, subscription_status, trial_started_at, trial_ends_at, stripe_customer_id, stripe_subscription_id, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return ok(res, data);
  } catch (err) {
    return fail(res, 500, 'INTERNAL_ERROR', err.message);
  }
});

router.get('/companies/:id', async (req, res) => {
  try {
    const { data: company, error } = await supabase
      .from('companies')
      .select('*, profiles(id, full_name, email, role), customers(id, first_name, last_name, email, active)')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    return ok(res, company);
  } catch (err) {
    return fail(res, 500, 'INTERNAL_ERROR', err.message);
  }
});

export default router;
