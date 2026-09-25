import cors from 'cors';
import express from 'express';

import { env } from './config/env.js';
import { pool } from './database/pool.js';

import authRouter from './routes/auth.js';
import expenseRouter from './routes/expenses.js';
import integrationRouter from './routes/integrations.js';

import {
  processIntegrationJobs,
} from './services/integrationWorker.js';

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());

/*
 * ------------------------------------------------
 * HEALTH
 * ------------------------------------------------
 */

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Sky Avenir Expense API',
  });
});

app.get('/health/db', async (_req, res) => {
  try {
    const result = await pool.query(
      `
        SELECT
          current_database() AS database,
          current_user AS user,
          NOW() AS server_time
      `,
    );

    res.json({
      status: 'ok',
      database: 'connected',
      details: result.rows[0],
    });
  } catch (error) {
    console.error(
      'Database health check failed:',
      error,
    );

    res.status(500).json({
      status: 'error',
      database: 'disconnected',
    });
  }
});

/*
 * ------------------------------------------------
 * API ROUTES
 * ------------------------------------------------
 */

app.use(
  '/api/auth',
  authRouter,
);

app.use(
  '/api/expenses',
  expenseRouter,
);

app.use(
  '/api/integrations',
  integrationRouter,
);

/*
 * ------------------------------------------------
 * 404
 * ------------------------------------------------
 *
 * Must remain after all real routes.
 */

app.use((_req, res) => {
  res.status(404).json({
    message: 'Route not found.',
  });
});

/*
 * ------------------------------------------------
 * SERVER
 * ------------------------------------------------
 */

app.listen(
  env.port,
  '0.0.0.0',
  () => {
    console.log(
      `Sky Avenir API running on port ${env.port}`,
    );

    console.log(
      `Authentication mode: ${env.authMode}`,
    );

    console.log(
      `Company API integration: ${
        env.companyApi.enabled
          ? 'enabled'
          : 'disabled'
      }`,
    );
  },
);

/*
 * ------------------------------------------------
 * INTEGRATION WORKER
 * ------------------------------------------------
 *
 * Lightweight check every 5 seconds.
 *
 * When COMPANY_API_ENABLED=false,
 * processIntegrationJobs() exits immediately.
 */

setInterval(
  () => {
    void processIntegrationJobs();
  },
  5000,
);