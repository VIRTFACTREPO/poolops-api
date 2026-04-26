import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn() }));

const { createClient } = await import('@supabase/supabase-js');
const { checkTechnicianLimit, checkPoolLimit } = await import('../src/middleware/planEnforcement.js');

function makeReq(companyId = 'co_123') {
  return { user: { companyId } };
}

function makeRes() {
  const res = { statusCode: 200, body: null };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (body) => {
    res.body = body;
    return res;
  };
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
        const secondEq = vi.fn().mockResolvedValue({ count: techCount, error: null });
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: secondEq,
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

      throw new Error(`Unexpected table: ${table}`);
    }),
  });
}

afterEach(() => vi.clearAllMocks());

describe('checkTechnicianLimit', () => {
  it('allows solo when under the technician limit', async () => {
    mockSupabase({ plan: 'solo', techCount: 0 });
    const res = makeRes();
    const next = vi.fn();

    await checkTechnicianLimit(makeReq(), res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.statusCode).toBe(200);
  });

  it('blocks solo when at the technician limit with 403 + upgrade message', async () => {
    mockSupabase({ plan: 'solo', techCount: 1 });
    const res = makeRes();

    await checkTechnicianLimit(makeReq(), res, vi.fn());

    expect(res.statusCode).toBe(403);
    expect(res.body.error.code).toBe('PLAN_LIMIT_EXCEEDED');
    expect(res.body.error.message).toContain('solo');
    expect(res.body.error.message).toContain('1 technicians');
    expect(res.body.error.message).toMatch(/Upgrade your plan/i);
  });

  it('allows pro when under the technician limit', async () => {
    mockSupabase({ plan: 'pro', techCount: 2 });
    const res = makeRes();
    const next = vi.fn();

    await checkTechnicianLimit(makeReq(), res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.statusCode).toBe(200);
  });

  it('blocks pro when at the technician limit with 403 + upgrade message', async () => {
    mockSupabase({ plan: 'pro', techCount: 3 });
    const res = makeRes();

    await checkTechnicianLimit(makeReq(), res, vi.fn());

    expect(res.statusCode).toBe(403);
    expect(res.body.error.code).toBe('PLAN_LIMIT_EXCEEDED');
    expect(res.body.error.message).toContain('pro');
    expect(res.body.error.message).toContain('3 technicians');
    expect(res.body.error.message).toMatch(/Upgrade your plan/i);
  });

  it('allows business regardless of technician count', async () => {
    mockSupabase({ plan: 'business', techCount: 999 });
    const res = makeRes();
    const next = vi.fn();

    await checkTechnicianLimit(makeReq(), res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.statusCode).toBe(200);
  });

  it('returns 403 FORBIDDEN when companyId is missing', async () => {
    const res = makeRes();

    await checkTechnicianLimit({ user: {} }, res, vi.fn());

    expect(res.statusCode).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});

describe('checkPoolLimit', () => {
  it('allows solo when under the pool limit', async () => {
    mockSupabase({ plan: 'solo', poolCount: 49 });
    const res = makeRes();
    const next = vi.fn();

    await checkPoolLimit(makeReq(), res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.statusCode).toBe(200);
  });

  it('blocks solo when at the pool limit with 403 + upgrade message', async () => {
    mockSupabase({ plan: 'solo', poolCount: 50 });
    const res = makeRes();

    await checkPoolLimit(makeReq(), res, vi.fn());

    expect(res.statusCode).toBe(403);
    expect(res.body.error.code).toBe('PLAN_LIMIT_EXCEEDED');
    expect(res.body.error.message).toContain('solo');
    expect(res.body.error.message).toContain('50 pools');
    expect(res.body.error.message).toMatch(/Upgrade your plan/i);
  });

  it('allows pro regardless of pool count', async () => {
    mockSupabase({ plan: 'pro', poolCount: 999 });
    const res = makeRes();
    const next = vi.fn();

    await checkPoolLimit(makeReq(), res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.statusCode).toBe(200);
  });

  it('allows business regardless of pool count', async () => {
    mockSupabase({ plan: 'business', poolCount: 999 });
    const res = makeRes();
    const next = vi.fn();

    await checkPoolLimit(makeReq(), res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.statusCode).toBe(200);
  });

  it('returns 403 FORBIDDEN when companyId is missing', async () => {
    const res = makeRes();

    await checkPoolLimit({ user: {} }, res, vi.fn());

    expect(res.statusCode).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});
