import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { fail } from '../utils/response.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return fail(res, 401, 'UNAUTHORIZED', 'Missing bearer token');

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.user = {
      id: payload.sub,
      role: payload.role,
      companyId: payload.company_id ?? payload.companyId ?? null,
      email: payload.email ?? null,
    };
    return next();
  } catch {
    return fail(res, 401, 'UNAUTHORIZED', 'Invalid or expired token');
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return fail(res, 401, 'UNAUTHORIZED', 'Authentication required');
    if (!roles.includes(req.user.role) && req.user.role !== 'superadmin') {
      return fail(res, 403, 'FORBIDDEN', `Requires role: ${roles.join(', ')}`);
    }
    return next();
  };
}
