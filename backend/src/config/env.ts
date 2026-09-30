import 'dotenv/config';

const port = Number(
  process.env.PORT ?? 4000,
);

const dbPort = Number(
  process.env.DB_PORT ?? 5432,
);

function parseAllowedWorkEmailDomains(): string[] {
  const configured =
    process.env.ALLOWED_WORK_EMAIL_DOMAINS ??
    'skyavenir.com';

  return configured
    .split(',')
    .map((domain) =>
      domain
        .trim()
        .toLowerCase()
        .replace(/^@/, ''),
    )
    .filter(Boolean);
}

export const env = {
  port,

  authMode:
    process.env.AUTH_MODE ?? 'session',

  appSessionSecret:
    process.env.APP_SESSION_SECRET ?? '',

    email: {
  host:
    process.env.SMTP_HOST ?? '',

  port:
    Number(
      process.env.SMTP_PORT ?? 465,
    ),

  secure:
    process.env.SMTP_SECURE === 'true',

  user:
    process.env.SMTP_USER ?? '',

  appPassword:
    process.env.SMTP_APP_PASSWORD ?? '',

  from:
    process.env.SMTP_FROM ?? '',
},
passwordReset: {
  codeExpiryMinutes:
    Number(
      process.env.PASSWORD_RESET_CODE_EXPIRY_MINUTES ?? 15,
    ),
},

receiptStorageDirectory:
  process.env.RECEIPT_STORAGE_DIRECTORY ??
  (process.env.RAILWAY_VOLUME_MOUNT_PATH
    ? `${process.env.RAILWAY_VOLUME_MOUNT_PATH}/receipts`
    : ''),

  allowedWorkEmailDomains:
    parseAllowedWorkEmailDomains(),

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

