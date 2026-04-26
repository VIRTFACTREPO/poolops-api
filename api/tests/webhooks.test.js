import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';

vi.mock('stripe', () => ({ default: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn() }));

const { default: Stripe } = await import('stripe');
const { createClient } = await import('@supabase/supabase-js');
const { default: webhooksRouter } = await import('../src/routes/webhooks.js');

function buildApp() {
  const app = express();
  app.use('/webhooks', webhooksRouter);
  return app;
}

function makeSupabaseMock() {
  const mockEq = vi.fn().mockResolvedValue({ error: null });
  const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
  const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate });
  createClient.mockReturnValue({ from: mockFrom });
  return { mockFrom, mockUpdate, mockEq };
}

function makeStripeConstructEvent(impl) {
  Stripe.mockImplementation(function () {
    this.webhooks = { constructEvent: vi.fn(impl) };
  });
}

afterEach(() => vi.clearAllMocks());

describe('POST /webhooks/stripe', () => {
  beforeEach(() => {
    makeSupabaseMock();
  });

  it('returns 400 when Stripe-Signature header is missing', async () => {
    const res = await request(buildApp())
      .post('/webhooks/stripe')
      .set('content-type', 'application/json')
      .send('{}');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('MISSING_SIGNATURE');
  });

  it('returns 400 when Stripe-Signature is invalid', async () => {
    makeStripeConstructEvent(() => {
      throw new Error('No signatures found matching the expected signature for payload');
    });

    const res = await request(buildApp())
      .post('/webhooks/stripe')
      .set('content-type', 'application/json')
      .set('stripe-signature', 'bad-sig')
      .send('{}');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_SIGNATURE');
    expect(res.body.error.message).toMatch(/Webhook signature verification failed/);
  });

  it('updates companies.plan on customer.subscription.updated', async () => {
    const { mockFrom, mockUpdate, mockEq } = makeSupabaseMock();
    makeStripeConstructEvent(() => ({
      type: 'customer.subscription.updated',
      data: {
        object: {
          metadata: {
            company_id: 'co_123',
            plan: 'pro',
          },
        },
      },
    }));

    const res = await request(buildApp())
      .post('/webhooks/stripe')
      .set('content-type', 'application/json')
      .set('stripe-signature', 'sig_ok')
      .send('{}');

    expect(res.status).toBe(200);
    expect(res.body.data.event).toBe('customer.subscription.updated');
    expect(res.body.data.plan).toBe('pro');
    expect(mockFrom).toHaveBeenCalledWith('companies');
    expect(mockUpdate).toHaveBeenCalledWith({ plan: 'pro' });
    expect(mockEq).toHaveBeenCalledWith('id', 'co_123');
  });

  it('downgrades to solo on customer.subscription.deleted', async () => {
    const { mockFrom, mockUpdate, mockEq } = makeSupabaseMock();
    makeStripeConstructEvent(() => ({
      type: 'customer.subscription.deleted',
      data: {
        object: {
          metadata: {
            company_id: 'co_456',
          },
        },
      },
    }));

    const res = await request(buildApp())
      .post('/webhooks/stripe')
      .set('content-type', 'application/json')
      .set('stripe-signature', 'sig_ok')
      .send('{}');

    expect(res.status).toBe(200);
    expect(res.body.data.event).toBe('customer.subscription.deleted');
    expect(res.body.data.plan).toBe('solo');
    expect(mockFrom).toHaveBeenCalledWith('companies');
    expect(mockUpdate).toHaveBeenCalledWith({ plan: 'solo' });
    expect(mockEq).toHaveBeenCalledWith('id', 'co_456');
  });

  it('defaults plan to solo when metadata.plan is unrecognised', async () => {
    const { mockUpdate } = makeSupabaseMock();
    makeStripeConstructEvent(() => ({
      type: 'customer.subscription.updated',
      data: { object: { metadata: { company_id: 'co_123', plan: 'enterprise' } } },
    }));

    const res = await request(buildApp())
      .post('/webhooks/stripe')
      .set('content-type', 'application/json')
      .set('stripe-signature', 'sig_ok')
      .send('{}');

    expect(res.status).toBe(200);
    expect(res.body.data.plan).toBe('solo');
    expect(mockUpdate).toHaveBeenCalledWith({ plan: 'solo' });
  });

  it('skips DB write on subscription.updated when company_id is absent', async () => {
    const { mockUpdate } = makeSupabaseMock();
    makeStripeConstructEvent(() => ({
      type: 'customer.subscription.updated',
      data: { object: { metadata: {} } },
    }));

    const res = await request(buildApp())
      .post('/webhooks/stripe')
      .set('content-type', 'application/json')
      .set('stripe-signature', 'sig_ok')
      .send('{}');

    expect(res.status).toBe(200);
    expect(res.body.data.skipped).toBe(true);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('skips DB write on subscription.deleted when company_id is absent', async () => {
    const { mockUpdate } = makeSupabaseMock();
    makeStripeConstructEvent(() => ({
      type: 'customer.subscription.deleted',
      data: { object: { metadata: {} } },
    }));

    const res = await request(buildApp())
      .post('/webhooks/stripe')
      .set('content-type', 'application/json')
      .set('stripe-signature', 'sig_ok')
      .send('{}');

    expect(res.status).toBe(200);
    expect(res.body.data.skipped).toBe(true);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('returns 200 skipped for unhandled event types', async () => {
    const { mockUpdate } = makeSupabaseMock();
    makeStripeConstructEvent(() => ({
      type: 'invoice.payment_succeeded',
      data: { object: { metadata: { company_id: 'co_789' } } },
    }));

    const res = await request(buildApp())
      .post('/webhooks/stripe')
      .set('content-type', 'application/json')
      .set('stripe-signature', 'sig_ok')
      .send('{}');

    expect(res.status).toBe(200);
    expect(res.body.data.skipped).toBe(true);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
