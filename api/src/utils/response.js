export function ok(res, data = {}, message = 'ok') {
  return res.status(200).json({ ok: true, message, data });
}

export function created(res, data = {}, message = 'created') {
  return res.status(201).json({ ok: true, message, data });
}

export function fail(res, status, code, message, details) {
  return res.status(status).json({
    ok: false,
    error: { code, message, ...(details ? { details } : {}) },
  });
}

export function notImplemented(res, route) {
  return fail(res, 501, 'NOT_IMPLEMENTED', `Route not implemented: ${route}`);
}
