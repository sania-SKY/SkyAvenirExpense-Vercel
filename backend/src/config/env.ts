import 'dotenv/config';

const port = Number(process.env.PORT ?? 4000);

const authMode =
  process.env.AUTH_MODE === 'microsoft'
    ? 'microsoft'
    : 'mock';

export const env = {
  port,
  authMode,

  microsoft: {
    tenantId: process.env.MICROSOFT_TENANT_ID ?? '',
    clientId: process.env.MICROSOFT_CLIENT_ID ?? '',
  },
};