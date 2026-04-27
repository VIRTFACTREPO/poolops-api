import app from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { runMigrations } from './migrate.js';

runMigrations()
  .catch(err => logger.warn({ err }, '[migrate] migration failed, continuing'))
  .finally(() => {
    app.listen(env.PORT, () => {
      logger.info({ port: env.PORT }, 'PoolOps API listening');
    });
  });
