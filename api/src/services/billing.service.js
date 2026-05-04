import Stripe from 'stripe';
import { env } from '../config/env.js';
import { supabase } from '../lib/supabase.js';

function getStripe() {
  if (!env.STRIPE_SECRET_KEY) return null;
  return new Stripe(env.STRIPE_SECRET_KEY);
}

export async function createStripeCustomer(email, companyName, companyId) {
  const stripe = getStripe();
  if (!stripe) {
    console.log('[billing] Stripe not configured — skipping customer creation');
    return null;
  }

  const customer = await stripe.customers.create({
    email,
    name: companyName,
    metadata: { company_id: companyId },
  });

  await supabase
    .from('companies')
    .update({ stripe_customer_id: customer.id })
    .eq('id', companyId);

  return customer;
}

export async function createCheckoutSession(company) {
  const stripe = getStripe();
  if (!stripe || !env.STRIPE_PRICE_ID) {
    console.log('[billing] Stripe or STRIPE_PRICE_ID not configured — returning stub URL');
    return { url: `${env.APP_URL}/settings?tab=billing&stub=1` };
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: company.stripe_customer_id,
    line_items: [{ price: env.STRIPE_PRICE_ID, quantity: 1 }],
    metadata: { company_id: company.id },
    subscription_data: { metadata: { company_id: company.id } },
    success_url: `${env.APP_URL}/settings?tab=billing&success=1`,
    cancel_url: `${env.APP_URL}/settings?tab=billing`,
  });

  return { url: session.url };
}

export async function createBillingPortalSession(company) {
  const stripe = getStripe();
  if (!stripe) {
    console.log('[billing] Stripe not configured — returning stub URL');
    return { url: `${env.APP_URL}/settings?tab=billing&stub=1` };
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: company.stripe_customer_id,
    return_url: `${env.APP_URL}/settings?tab=billing`,
  });

  return { url: session.url };
}

export function getBillingStatus(company) {
  const trialDaysRemaining = company.trial_ends_at
    ? Math.max(0, Math.floor((new Date(company.trial_ends_at) - Date.now()) / 86400000))
    : 0;

  return {
    subscription_status: company.subscription_status,
    trial_ends_at: company.trial_ends_at,
    trial_days_remaining: trialDaysRemaining,
    plan: company.plan,
  };
}
