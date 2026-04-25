import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';

vi.mock('stripe', () => ({ default: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn() }));

const { default: Stripe } = await import('stripe');
const { createClient } = await import('@supabase/supabase-js');
const { default: webhooksRouter } = await import('../src/routes/webhooks.js');

const app = express();
app.use('/webhooks', webhooksRouter);

function makeSupabaseMock() {
  const mockEq = vi.fn().mockResolvedValue({ error: null });
  const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
  createClient.mockReturnValue({ from: vi.fn().mockReturnValue({ update: mockUpdate }) });
  return { mockUpdate, mockEq };
}

// Stripe must be called with `new`, so mockImplementation requires a regular function
function makeStripeConstructEvent(impl) {
  Stripe.mockImplementation(function () {
    this.webhooks = { constructEvent: impl };
  });
}

afterEach(() => vi.clearAllMocks());

describe('POST /webhooks/stripe — signature validation', () => {
  it('returns 400 when Stripe-Signature header is missing', async () => {
    const res = await request(app)
      .post('/webhooks/stripe')
      .type('application/json')
      .send('{}');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('MISSING_SIGNATURE');
  });

  it('returns 400 when constructEvent throws (invalid signature)', async () => {
    makeStripeConstructEvent(() => { throw new Error('No signatures found matching'); });
    const res = await request(app)
      .post('/webhooks/stripe')
      .type('application/json')
      .set('stripe-signature', 'bad-sig')
      .send('{}');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_SIGNATURE');
    expect(res.body.error.message).toMatch(/No signatures found/);
  });
});

describe('POST /webhooks/stripe — customer.subscription.updated', () => {
  let supabaseMocks;
  beforeEach(() => { supabaseMocks = makeSupabaseMock(); });

  it('updates companies.plan to the plan from metadata', async () => {
    makeStripeConstructEvent(() => ({
      type: 'customer.subscription.updated',
      data: { object: { metadata: { company_id: 'co_123', plan: 'pro' } } },
    }));
    const res = await request(app)
      .post('/webhooks/stripe')
      .type('application/json')
      .set('stripe-signature', 'sig')
      .send('{}');
    expect(res.status).toBe(200);
    expect(res.body.data.plan).toBe('pro');
    expect(supabaseMocks.mockUpdate).toHaveBeenCalledWith({ plan: 'pro' });
  });

  it('defaults to solo when metadata plan is unrecognised', async () => {
    makeStripeConstructEvent(() => ({
      type: 'customer.subscription.updated',
      data: { object: { metadata: { company_id: 'co_123', plan: 'enterprise' } } },
    }));
    const res = await request(app)
      .post('/webhooks/stripe')
      .type('application/json')
      .set('stripe-signature', 'sig')
      .send('{}');
    expect(res.status).toBe(200);
    expect(res.body.data.plan).toBe('solo');
    expect(supabaseMocks.mockUpdate).toHaveBeenCalledWith({ plan: 'solo' });
  });

  it('skips when company_id is absent from metadata', async () => {
    makeStripeConstructEvent(() => ({
      type: 'customer.subscription.updated',
      data: { object: { metadata: {} } },
    }));
    const res = await request(app)
      .post('/webhooks/stripe')
      .type('application/json')
      .set('stripe-signature', 'sig')
      .send('{}');
    expect(res.status).toBe(200);
    expect(res.body.data.skipped).toBe(true);
    expect(supabaseMocks.mockUpdate).not.toHaveBeenCalled();
  });
});

describe('POST /webhooks/stripe — customer.subscription.deleted', () => {
  let supabaseMocks;
  beforeEach(() => { supabaseMocks = makeSupabaseMock(); });

  it('downgrades companies.plan to solo', async () => {
    makeStripeConstructEvent(() => ({
      type: 'customer.subscription.deleted',
      data: { object: { metadata: { company_id: 'co_456' } } },
    }));
    const res = await request(app)
      .post('/webhooks/stripe')
      .type('application/json')
      .set('stripe-signature', 'sig')
      .send('{}');
    expect(res.status).toBe(200);
    expect(res.body.data.plan).toBe('solo');
    expect(supabaseMocks.mockUpdate).toHaveBeenCalledWith({ plan: 'solo' });
  });

  it('skips when company_id is absent', async () => {
    makeStripeConstructEvent(() => ({
      type: 'customer.subscription.deleted',
      data: { object: { metadata: {} } },
    }));
    const res = await request(app)
      .post('/webhooks/stripe')
      .type('application/json')
      .set('stripe-signature', 'sig')
      .send('{}');
    expect(res.status).toBe(200);
    expect(res.body.data.skipped).toBe(true);
    expect(supabaseMocks.mockUpdate).not.toHaveBeenCalled();
  });
});

describe('POST /webhooks/stripe — unhandled event types', () => {
  beforeEach(() => makeSupabaseMock());

  it('returns 200 skipped for unknown event type', async () => {
    makeStripeConstructEvent(() => ({
      type: 'invoice.payment_succeeded',
      data: { object: { metadata: { company_id: 'co_789' } } },
    }));
    const res = await request(app)
      .post('/webhooks/stripe')
      .type('application/json')
      .set('stripe-signature', 'sig')
      .send('{}');
    expect(res.status).toBe(200);
    expect(res.body.data.skipped).toBe(true);
  });
});
