import 'dotenv/config';

const port = Number(
  process.env.PORT ?? 4000,
);

const dbPort = Number(
  process.env.DB_PORT ?? 5432,
);

export const env = {
  port,

  authMode:
    process.env.AUTH_MODE ?? 'session',

  appSessionSecret:
    process.env.APP_SESSION_SECRET ?? '',

  microsoft: {
    tenantId:
      process.env.MICROSOFT_TENANT_ID ?? '',

    clientId:
      process.env.MICROSOFT_CLIENT_ID ?? '',
  },

  google: {
    webClientId:
      process.env.GOOGLE_WEB_CLIENT_ID ?? '',
  },

  database: {
    host:
      process.env.DB_HOST ?? 'localhost',

    port:
      dbPort,

    name:
      process.env.DB_NAME ?? '',

    user:
      process.env.DB_USER ?? '',

    password:
      process.env.DB_PASSWORD ?? '',
  },

  companyApi: {
    enabled:
      process.env.COMPANY_API_ENABLED === 'true',

    baseUrl:
      process.env.COMPANY_API_BASE_URL ?? '',

    clientId:
      process.env.COMPANY_API_CLIENT_ID ?? '',

    secret:
      process.env.COMPANY_API_SECRET ?? '',

    webhookSecret:
      process.env.COMPANY_WEBHOOK_SECRET ?? '',
  },
};