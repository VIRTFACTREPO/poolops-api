import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn() }));

const { createClient } = await import('@supabase/supabase-js');
const { checkTechnicianLimit, checkPoolLimit } = await import('../src/middleware/planEnforcement.js');

function makeReq(companyId = 'co_123') {
  return { user: { companyId } };
}

function makeRes() {
  const res = { statusCode: null, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (body) => { res.body = body; return res; };
  return res;
}

function mockSupabase({ plan = 'solo', techCount = 0, poolCount = 0 } = {}) {
  createClient.mockReturnValue({
    from: vi.fn().mockImplementation((table) => {
      if (table === 'companies') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: { plan }, error: null }),
            }),
          }),
        };
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ count: techCount, error: null }),
            }),
          }),
        };
      }
      if (table === 'pools') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count: poolCount, error: null }),
          }),
        };
      }
    }),
  });
}

afterEach(() => vi.clearAllMocks());

describe('checkTechnicianLimit', () => {
  describe('solo plan (max 1)', () => {
    it('calls next when count is 0', async () => {
      mockSupabase({ plan: 'solo', techCount: 0 });
      const next = vi.fn();
      await checkTechnicianLimit(makeReq(), makeRes(), next);
      expect(next).toHaveBeenCalled();
    });

    it('returns 403 when count reaches 1', async () => {
      mockSupabase({ plan: 'solo', techCount: 1 });
      const res = makeRes();
      await checkTechnicianLimit(makeReq(), res, vi.fn());
      expect(res.statusCode).toBe(403);
      expect(res.body.error.code).toBe('PLAN_LIMIT_EXCEEDED');
      expect(res.body.error.message).toMatch(/1/);
      expect(res.body.error.message).toMatch(/Upgrade/i);
    });
  });

  describe('pro plan (max 3)', () => {
    it('calls next when count is 2', async () => {
      mockSupabase({ plan: 'pro', techCount: 2 });
      const next = vi.fn();
      await checkTechnicianLimit(makeReq(), makeRes(), next);
      expect(next).toHaveBeenCalled();
    });

    it('returns 403 when count reaches 3', async () => {
      mockSupabase({ plan: 'pro', techCount: 3 });
      const res = makeRes();
      await checkTechnicianLimit(makeReq(), res, vi.fn());
      expect(res.statusCode).toBe(403);
      expect(res.body.error.code).toBe('PLAN_LIMIT_EXCEEDED');
      expect(res.body.error.message).toMatch(/3/);
      expect(res.body.error.message).toMatch(/Upgrade/i);
    });
  });

  describe('business plan (unlimited)', () => {
    it('always calls next regardless of count', async () => {
      mockSupabase({ plan: 'business', techCount: 10000 });
      const next = vi.fn();
      await checkTechnicianLimit(makeReq(), makeRes(), next);
      expect(next).toHaveBeenCalled();
    });
  });

  it('returns 403 when request has no companyId', async () => {
    const res = makeRes();
    await checkTechnicianLimit({ user: {} }, res, vi.fn());
    expect(res.statusCode).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});

describe('checkPoolLimit', () => {
  describe('solo plan (max 50)', () => {
    it('calls next when count is 49', async () => {
      mockSupabase({ plan: 'solo', poolCount: 49 });
      const next = vi.fn();
      await checkPoolLimit(makeReq(), makeRes(), next);
      expect(next).toHaveBeenCalled();
    });

    it('returns 403 when count reaches 50', async () => {
      mockSupabase({ plan: 'solo', poolCount: 50 });
      const res = makeRes();
      await checkPoolLimit(makeReq(), res, vi.fn());
      expect(res.statusCode).toBe(403);
      expect(res.body.error.code).toBe('PLAN_LIMIT_EXCEEDED');
      expect(res.body.error.message).toMatch(/50/);
      expect(res.body.error.message).toMatch(/Upgrade/i);
    });
  });

  describe('pro plan (unlimited pools)', () => {
    it('always calls next regardless of count', async () => {
      mockSupabase({ plan: 'pro', poolCount: 9999 });
      const next = vi.fn();
      await checkPoolLimit(makeReq(), makeRes(), next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('business plan (unlimited pools)', () => {
    it('always calls next regardless of count', async () => {
      mockSupabase({ plan: 'business', poolCount: 9999 });
      const next = vi.fn();
      await checkPoolLimit(makeReq(), makeRes(), next);
      expect(next).toHaveBeenCalled();
    });
  });

  it('returns 403 when request has no companyId', async () => {
    const res = makeRes();
    await checkPoolLimit({ user: {} }, res, vi.fn());
    expect(res.statusCode).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});
