import {
  Router,
} from 'express';

import {
  compare,
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

function getSessionSecret() {
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

async function createSessionToken(
  databaseUserId:
    string,

  user:
    AuthenticatedUser,
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
        typeof req.body?.email ===
        'string'
          ? req.body.email
              .trim()
              .toLowerCase()
          : '';

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
        !email.endsWith(
          '@skyavenir.com',
        )
      ) {
        res.status(
          403,
        ).json({
          authenticated:
            false,

          message:
            'Please use your Sky Avenir work email.',
        });

        return;
      }

      const result =
        await pool.query<{
          id:
            string;

          provider_user_id:
            string;

          email:
            string;

          name:
            string;

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
       * Keep this intentionally generic.
       * Do not reveal whether an email exists.
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

      res.json({
        authenticated:
          true,

        accessToken,

        user: {
          id:
            row.id,

          provider:
            'email',

          providerUserId:
            row.provider_user_id,

          name:
            row.name,

          email:
            authenticatedUser.email,
        },
      });
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
 *
 * Useful later for checking an existing session.
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