import {
  Router,
} from 'express';

import {
  compare,
  hash,
} from 'bcryptjs';

import {
  SignJWT,
} from 'jose';

import {
  env,
} from '../config/env.js';

import {
  pool,
} from '../database/pool.js';

import {
  requireAuth,
} from '../middleware/auth.js';

import type {
  AuthenticatedUser,
} from '../middleware/auth.js';

const router =
  Router();

const PASSWORD_MIN_LENGTH =
  8;

const BCRYPT_ROUNDS =
  12;

/*
 * ------------------------------------------------
 * SESSION SECRET
 * ------------------------------------------------
 */

function getSessionSecret(): Uint8Array {
  if (
    !env.appSessionSecret
  ) {
    throw new Error(
      'APP_SESSION_SECRET is not configured.',
    );
  }

  return new TextEncoder().encode(
    env.appSessionSecret,
  );
}

/*
 * ------------------------------------------------
 * EMAIL HELPERS
 * ------------------------------------------------
 */

function normalizeEmail(
  value: unknown,
): string {
  if (
    typeof value !== 'string'
  ) {
    return '';
  }

  return value
    .trim()
    .toLowerCase();
}

function isAllowedWorkEmail(
  email: string,
): boolean {
  const atIndex =
    email.lastIndexOf('@');

  if (
    atIndex <= 0 ||
    atIndex ===
      email.length - 1
  ) {
    return false;
  }

  const domain =
    email
      .slice(
        atIndex + 1,
      )
      .toLowerCase();

  return (
    env.allowedWorkEmailDomains
      .includes(
        domain,
      )
  );
}

function getAllowedEmailMessage(): string {
  if (
    env.allowedWorkEmailDomains
      .length === 1
  ) {
    return `Please use your ${env.allowedWorkEmailDomains[0]} work email.`;
  }

  return 'Please use an approved work email address.';
}

/*
 * ------------------------------------------------
 * SESSION TOKEN
 * ------------------------------------------------
 */

async function createSessionToken(
  databaseUserId: string,
  user: AuthenticatedUser,
) {
  return new SignJWT({
    provider:
      user.provider,

    providerUserId:
      user.providerUserId,

    name:
      user.name,

    email:
      user.email,
  })
    .setProtectedHeader({
      alg:
        'HS256',
    })
    .setSubject(
      databaseUserId,
    )
    .setIssuer(
      'sky-avenir-expense-api',
    )
    .setAudience(
      'sky-avenir-expense-app',
    )
    .setIssuedAt()
    .setExpirationTime(
      '8h',
    )
    .sign(
      getSessionSecret(),
    );
}

/*
 * ------------------------------------------------
 * AUTH RESPONSE
 * ------------------------------------------------
 */

function createAuthenticatedResponse(
  databaseUserId: string,
  user: AuthenticatedUser,
  accessToken: string,
) {
  return {
    authenticated:
      true,

    accessToken,

    user: {
      id:
        databaseUserId,

      provider:
        'email' as const,

      providerUserId:
        user.providerUserId,

      name:
        user.name,

      email:
        user.email,
    },
  };
}

/*
 * ------------------------------------------------
 * POST /api/auth/register
 * ------------------------------------------------
 *
 * Creates a real user account.
 *
 * Password is NEVER stored directly.
 * Only password_hash is stored.
 * ------------------------------------------------
 */

router.post(
  '/register',

  async (
    req,
    res,
  ) => {
    const client =
      await pool.connect();

    try {
      const name =
        typeof req.body?.name ===
        'string'
          ? req.body.name
              .trim()
              .replace(
                /\s+/g,
                ' ',
              )
          : '';

      const email =
        normalizeEmail(
          req.body?.email,
        );

      const password =
        typeof req.body?.password ===
        'string'
          ? req.body.password
          : '';

      /*
       * ----------------------------
       * Validate name
       * ----------------------------
       */

      if (
        name.length < 2
      ) {
        res.status(
          400,
        ).json({
          authenticated:
            false,

          message:
            'Please enter your full name.',
        });

        return;
      }

      if (
        name.length > 120
      ) {
        res.status(
          400,
        ).json({
          authenticated:
            false,

          message:
            'Name is too long.',
        });

        return;
      }

      /*
       * ----------------------------
       * Validate email
       * ----------------------------
       */

      if (!email) {
        res.status(
          400,
        ).json({
          authenticated:
            false,

          message:
            'Please enter your work email.',
        });

        return;
      }

      if (
        !isAllowedWorkEmail(
          email,
        )
      ) {
        res.status(
          403,
        ).json({
          authenticated:
            false,

          message:
            getAllowedEmailMessage(),
        });

        return;
      }

      /*
       * ----------------------------
       * Validate password
       * ----------------------------
       */

      if (
        password.length <
        PASSWORD_MIN_LENGTH
      ) {
        res.status(
          400,
        ).json({
          authenticated:
            false,

          message:
            `Password must contain at least ${PASSWORD_MIN_LENGTH} characters.`,
        });

        return;
      }

      /*
       * ----------------------------
       * Begin transaction
       * ----------------------------
       */

      await client.query(
        'BEGIN',
      );

      /*
       * Check whether an email
       * account already exists.
       */

      const existing =
        await client.query<{
          id: string;
        }>(
          `
            SELECT id
            FROM users
            WHERE
              auth_provider = 'email'
              AND LOWER(email) = LOWER($1)
            LIMIT 1
          `,
          [
            email,
          ],
        );

      if (
        existing.rowCount
      ) {
        await client.query(
          'ROLLBACK',
        );

        res.status(
          409,
        ).json({
          authenticated:
            false,

          message:
            'An account already exists for this work email.',
        });

        return;
      }

      /*
       * Never store plaintext password.
       */

      const passwordHash =
        await hash(
          password,
          BCRYPT_ROUNDS,
        );

      /*
       * For email authentication,
       * normalized email is a stable
       * provider identity.
       */

      const providerUserId =
        email;

      const created =
        await client.query<{
          id: string;

          provider_user_id: string;

          email: string;

          name: string;
        }>(
          `
            INSERT INTO users (
              auth_provider,
              provider_user_id,
              email,
              name,
              password_hash
            )
            VALUES (
              'email',
              $1,
              $2,
              $3,
              $4
            )
            RETURNING
              id,
              provider_user_id,
              email,
              name
          `,
          [
            providerUserId,
            email,
            name,
            passwordHash,
          ],
        );

      const row =
        created.rows[0];

      const authenticatedUser:
        AuthenticatedUser = {
          id:
            row.id,

          provider:
            'email',

          providerUserId:
            row.provider_user_id,

          name:
            row.name,

          email:
            row.email
              .trim()
              .toLowerCase(),
        };

      const accessToken =
        await createSessionToken(
          row.id,
          authenticatedUser,
        );

      await client.query(
        'COMMIT',
      );

      res.status(
        201,
      ).json(
        createAuthenticatedResponse(
          row.id,
          authenticatedUser,
          accessToken,
        ),
      );
    } catch (error) {
      try {
        await client.query(
          'ROLLBACK',
        );
      } catch {
        // Do not hide the original error.
      }

      /*
       * PostgreSQL unique_violation.
       *
       * This protects against two
       * simultaneous registrations
       * using the same email.
       */
      if (
        typeof error ===
          'object' &&
        error !== null &&
        'code' in error &&
        error.code ===
          '23505'
      ) {
        res.status(
          409,
        ).json({
          authenticated:
            false,

          message:
            'An account already exists for this work email.',
        });

        return;
      }

      console.error(
        'Account registration failed:',
        error,
      );

      res.status(
        500,
      ).json({
        authenticated:
          false,

        message:
          'Unable to create your account at this time.',
      });
    } finally {
      client.release();
    }
  },
);

/*
 * ------------------------------------------------
 * POST /api/auth/login
 * ------------------------------------------------
 */

router.post(
  '/login',

  async (
    req,
    res,
  ) => {
    try {
      const email =
        normalizeEmail(
          req.body?.email,
        );

      const password =
        typeof req.body?.password ===
        'string'
          ? req.body.password
          : '';

      if (
        !email ||
        !password
      ) {
        res.status(
          400,
        ).json({
          authenticated:
            false,

          message:
            'Work email and password are required.',
        });

        return;
      }

      if (
        !isAllowedWorkEmail(
          email,
        )
      ) {
        res.status(
          403,
        ).json({
          authenticated:
            false,

          message:
            getAllowedEmailMessage(),
        });

        return;
      }

      const result =
        await pool.query<{
          id: string;

          provider_user_id: string;

          email: string;

          name: string;

          password_hash:
            string | null;
        }>(
          `
            SELECT
              id,
              provider_user_id,
              email,
              name,
              password_hash
            FROM users
            WHERE
              auth_provider = 'email'
              AND LOWER(email) = LOWER($1)
            LIMIT 1
          `,
          [
            email,
          ],
        );

      const row =
        result.rows[0];

      /*
       * Intentionally generic.
       *
       * Never tell someone whether
       * the email or password was
       * specifically incorrect.
       */

      if (
        !row ||
        !row.password_hash
      ) {
        res.status(
          401,
        ).json({
          authenticated:
            false,

          message:
            'Invalid work email or password.',
        });

        return;
      }

      const validPassword =
        await compare(
          password,
          row.password_hash,
        );

      if (
        !validPassword
      ) {
        res.status(
          401,
        ).json({
          authenticated:
            false,

          message:
            'Invalid work email or password.',
        });

        return;
      }

      const authenticatedUser:
        AuthenticatedUser = {
          id:
            row.id,

          provider:
            'email',

          providerUserId:
            row.provider_user_id,

          name:
            row.name,

          email:
            row.email
              .trim()
              .toLowerCase(),
        };

      const accessToken =
        await createSessionToken(
          row.id,
          authenticatedUser,
        );

      res.json(
        createAuthenticatedResponse(
          row.id,
          authenticatedUser,
          accessToken,
        ),
      );
    } catch (error) {
      console.error(
        'Email authentication failed:',
        error,
      );

      res.status(
        500,
      ).json({
        authenticated:
          false,

        message:
          'Unable to sign in at this time.',
      });
    }
  },
);

/*
 * ------------------------------------------------
 * GET /api/auth/me
 * ------------------------------------------------
 */

router.get(
  '/me',
  requireAuth,

  (
    req,
    res,
  ) => {
    if (
      !req.user
    ) {
      res.status(
        401,
      ).json({
        authenticated:
          false,

        message:
          'Authentication required.',
      });

      return;
    }

    res.json({
      authenticated:
        true,

      user:
        req.user,
    });
  },
);

export default router;