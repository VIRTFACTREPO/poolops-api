import express from 'express';
import { httpLogger } from './config/logger.js';
import { ok, fail } from './utils/response.js';

import authRoutes from './routes/auth.js';
import technicianRoutes from './routes/technician.js';
import ownerRoutes from './routes/owner.js';
import adminRoutes from './routes/admin.js';
import sharedRoutes from './routes/shared.js';
import webhookRoutes from './routes/webhooks.js';

const app = express();

app.set('trust proxy', 1);
app.use(httpLogger);
app.use('/webhooks', webhookRoutes);
app.use(express.json({ limit: '15mb' }));

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.get('/healthz', (_req, res) => ok(res, { service: 'poolops-api' }));

app.use('/auth', authRoutes);
app.use('/technician', technicianRoutes);
app.use('/owner', ownerRoutes);
app.use('/admin', adminRoutes);
app.use('/shared', sharedRoutes);

app.use((req, res) => fail(res, 404, 'NOT_FOUND', `Unknown route: ${req.method} ${req.originalUrl}`));

app.use((err, _req, res, _next) => {
  console.error(err);
  return fail(res, 500, 'INTERNAL_ERROR', 'Unexpected server error');
});

export default app;
