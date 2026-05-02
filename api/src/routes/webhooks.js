import { Router } from 'express';
import express from 'express';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import { ok, fail } from '../utils/response.js';

const router = Router();

function getSupabaseAdmin() {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

const STATUS_MAP = {
  active: 'active',
  past_due: 'past_due',
  canceled: 'cancelled',
  cancelled: 'cancelled',
  trialing: 'trialing',
};

router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sigHeader = req.headers['stripe-signature'];
  if (!sigHeader) return fail(res, 400, 'MISSING_SIGNATURE', 'Missing Stripe-Signature header');

  const stripe = new Stripe(env.STRIPE_SECRET_KEY);
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sigHeader, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return fail(res, 400, 'INVALID_SIGNATURE', `Webhook signature verification failed: ${err.message}`);
  }

  const supabase = getSupabaseAdmin();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const companyId = session.metadata?.company_id;
    const subscriptionId = session.subscription;
    if (!companyId) return ok(res, { received: true, skipped: true });
    await supabase
      .from('companies')
      .update({ subscription_status: 'active', stripe_subscription_id: subscriptionId })
      .eq('id', companyId);
    return ok(res, { received: true, event: event.type });
  }

  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object;
    const customerId = invoice.customer;
    await supabase
      .from('companies')
      .update({ subscription_status: 'active' })
      .eq('stripe_customer_id', customerId);
    return ok(res, { received: true, event: event.type });
  }

  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object;
    const customerId = invoice.customer;
    await supabase
      .from('companies')
      .update({ subscription_status: 'past_due' })
      .eq('stripe_customer_id', customerId);
    return ok(res, { received: true, event: event.type });
  }

  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object;
    const companyId = subscription?.metadata?.company_id;
    if (!companyId) return ok(res, { received: true, skipped: true });

    const plan = subscription?.metadata?.plan || 'solo';
    const validPlans = ['solo', 'pro', 'business'];
    const newPlan = validPlans.includes(plan) ? plan : 'solo';
    const rawStatus = subscription.status;
    const newStatus = STATUS_MAP[rawStatus] ?? 'active';

    await supabase
      .from('companies')
      .update({ plan: newPlan, subscription_status: newStatus })
      .eq('id', companyId);
    return ok(res, { received: true, event: event.type, plan: newPlan, subscription_status: newStatus });
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    const companyId = subscription?.metadata?.company_id;
    if (!companyId) return ok(res, { received: true, skipped: true });
    await supabase
      .from('companies')
      .update({ plan: 'solo', subscription_status: 'cancelled' })
      .eq('id', companyId);
    return ok(res, { received: true, event: event.type });
  }

  return ok(res, { received: true, skipped: true });
});

router.post('/resend', express.json(), (req, res) => {
  return ok(res, { received: true });
});

export default router;
