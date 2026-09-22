import cors from 'cors';
import express from 'express';

import { env } from './config/env.js';
import authRouter from './routes/auth.js';

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Sky Avenir Expense API',
  });
});

app.use('/api/auth', authRouter);

app.use((_req, res) => {
  res.status(404).json({
    message: 'Route not found.',
  });
});

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
  },
);