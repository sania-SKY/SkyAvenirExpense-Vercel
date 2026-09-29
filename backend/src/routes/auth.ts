import {
  Router,
} from 'express';

import {
  compare,
  hash,
} from 'bcryptjs';

import {
  randomInt,
} from 'node:crypto';

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

import {
  sendPasswordResetCode,
} from '../services/emailService.js';

const router =
  Router();

const PASSWORD_MIN_LENGTH =
  8;

const BCRYPT_ROUNDS =
  12;

const RESET_CODE_BCRYPT_ROUNDS =
  10;

const RESET_REQUEST_COOLDOWN_SECONDS =
  60;

/*
 * ------------------------------------------------
 * SESSION SECRET
 * ------------------------------------------------
 */

function getSessionSecret():
  Uint8Array {
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
  value:
    unknown,
): string {
  if (
    typeof value !==
    'string'
  ) {
    return '';
  }

  return value
    .trim()
    .toLowerCase();
}

function isAllowedWorkEmail(
  email:
    string,
): boolean {
  const atIndex =
    email.lastIndexOf(
      '@',
    );

  if (
    atIndex <=
      0 ||
    atIndex ===
      email.length -
        1
  ) {
    return false;
  }

  const domain =
    email
      .slice(
        atIndex +
          1,
      )
      .toLowerCase();

  return (
    env.allowedWorkEmailDomains
      .includes(
        domain,
      )
  );
}

function getAllowedEmailMessage():
  string {
  if (
    env.allowedWorkEmailDomains
      .length ===
    1
  ) {
    return `Please use your ${env.allowedWorkEmailDomains[0]} work email.`;
  }

  return 'Please use an approved work email address.';
}

/*
 * ------------------------------------------------
 * RESET CODE
 * ------------------------------------------------
 */

function generateResetCode():
  string {
  return randomInt(
    100000,
    1000000,
  ).toString();
}

function getResetExpiryMinutes():
  number {
  const configured =
    env.passwordReset
      .codeExpiryMinutes;

  if (
    !Number.isFinite(
      configured,
    ) ||
    configured <
      1
  ) {
    return 15;
  }

  return Math.floor(
    configured,
  );
}

const genericForgotPasswordResponse = {
  message:
    'If an account exists for that email, a password reset code has been sent.',
};

/*
 * ------------------------------------------------
 * SESSION TOKEN
 * ------------------------------------------------
 *
 * The app stores this token on the device and
 * restores it on launch, so a short lifetime would
 * force a fresh sign-in mid-demo. 30 days keeps a
 * Home Screen install signed in without needing a
 * refresh-token flow.
 * ------------------------------------------------
 */

const SESSION_TOKEN_LIFETIME =
  '30d';

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
      SESSION_TOKEN_LIFETIME,
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
  databaseUserId:
    string,

  user:
    AuthenticatedUser,

  accessToken:
    string,
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
       * Name validation
       */

      if (
        name.length <
        2
      ) {
        res
          .status(400)
          .json({
            authenticated:
              false,

            message:
              'Please enter your full name.',
          });

        return;
      }

      if (
        name.length >
        120
      ) {
        res
          .status(400)
          .json({
            authenticated:
              false,

            message:
              'Name is too long.',
          });

        return;
      }

      /*
       * Email validation
       */

      if (!email) {
        res
          .status(400)
          .json({
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
        res
          .status(403)
          .json({
            authenticated:
              false,

            message:
              getAllowedEmailMessage(),
          });

        return;
      }

      /*
       * Password validation
       */

      if (
        password.length <
        PASSWORD_MIN_LENGTH
      ) {
        res
          .status(400)
          .json({
            authenticated:
              false,

            message:
              `Password must contain at least ${PASSWORD_MIN_LENGTH} characters.`,
          });

        return;
      }

      await client.query(
        'BEGIN',
      );

      const existing =
        await client.query<{
          id:
            string;
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

        res
          .status(409)
          .json({
            authenticated:
              false,

            message:
              'An account already exists for this work email.',
          });

        return;
      }

      const passwordHash =
        await hash(
          password,
          BCRYPT_ROUNDS,
        );

      const providerUserId =
        email;

      const created =
        await client.query<{
          id:
            string;

          provider_user_id:
            string;

          email:
            string;

          name:
            string;
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

      res
        .status(201)
        .json(
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
        // Keep original error.
      }

      /*
       * PostgreSQL unique violation.
       */

      if (
        typeof error ===
          'object' &&
        error !==
          null &&
        'code' in
          error &&
        error.code ===
          '23505'
      ) {
        res
          .status(409)
          .json({
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

      res
        .status(500)
        .json({
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
        res
          .status(400)
          .json({
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
        res
          .status(403)
          .json({
            authenticated:
              false,

            message:
              getAllowedEmailMessage(),
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
       * Generic on purpose:
       * never reveal whether email or password
       * specifically failed.
       */

      if (
        !row ||
        !row.password_hash
      ) {
        res
          .status(401)
          .json({
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
        res
          .status(401)
          .json({
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

      res
        .status(500)
        .json({
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
 * POST /api/auth/forgot-password
 * ------------------------------------------------
 *
 * Creates a short-lived one-time code.
 *
 * Important:
 * - Never stores the plain code.
 * - Never reveals whether an account exists.
 * - Previous unused codes are invalidated.
 * - Requests are throttled per account.
 * ------------------------------------------------
 */

router.post(
  '/forgot-password',

  async (
    req,
    res,
  ) => {
    try {
      const email =
        normalizeEmail(
          req.body?.email,
        );

      /*
       * Basic input validation does not reveal
       * account existence.
       */

      if (!email) {
        res
          .status(400)
          .json({
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
        res
          .status(403)
          .json({
            message:
              getAllowedEmailMessage(),
          });

        return;
      }

      const result =
        await pool.query<{
          id:
            string;

          email:
            string;
        }>(
          `
            SELECT
              id,
              email
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

      const user =
        result.rows[0];

      /*
       * Do not disclose whether account exists.
       */

      if (!user) {
        res.json(
          genericForgotPasswordResponse,
        );

        return;
      }

      /*
       * Simple server-side cooldown.
       *
       * Prevents repeatedly sending codes if the
       * button is pressed many times.
       */

      const recentRequest =
        await pool.query<{
          id:
            string;
        }>(
          `
            SELECT id
            FROM password_reset_codes
            WHERE
              user_id = $1
              AND created_at >
                  NOW() -
                  ($2 * INTERVAL '1 second')
            ORDER BY
              created_at DESC
            LIMIT 1
          `,
          [
            user.id,
            RESET_REQUEST_COOLDOWN_SECONDS,
          ],
        );

      if (
        recentRequest.rowCount
      ) {
        res.json(
          genericForgotPasswordResponse,
        );

        return;
      }

      const resetCode =
        generateResetCode();

      const codeHash =
        await hash(
          resetCode,
          RESET_CODE_BCRYPT_ROUNDS,
        );

      const expiryMinutes =
        getResetExpiryMinutes();

      const client =
        await pool.connect();

      let resetRecordId:
        string | null =
        null;

      try {
        await client.query(
          'BEGIN',
        );

        /*
         * Expire previous active codes.
         */

        await client.query(
          `
            UPDATE password_reset_codes
            SET used_at = NOW()
            WHERE
              user_id = $1
              AND used_at IS NULL
          `,
          [
            user.id,
          ],
        );

        const inserted =
          await client.query<{
            id:
              string;
          }>(
            `
              INSERT INTO password_reset_codes (
                user_id,
                code_hash,
                expires_at
              )
              VALUES (
                $1,
                $2,
                NOW() +
                  ($3 * INTERVAL '1 minute')
              )
              RETURNING id
            `,
            [
              user.id,
              codeHash,
              expiryMinutes,
            ],
          );

        resetRecordId =
          inserted.rows[0].id;

        await client.query(
          'COMMIT',
        );
      } catch (error) {
        await client.query(
          'ROLLBACK',
        );

        throw error;
      } finally {
        client.release();
      }

      /*
       * Send only after DB transaction succeeds.
       */

      try {
        await sendPasswordResetCode(
          user.email,
          resetCode,
        );
      } catch (error) {
        console.error(
          'Password reset email delivery failed:',
          error,
        );

        /*
         * Invalidate a code that was not delivered.
         */

        if (
          resetRecordId
        ) {
          try {
            await pool.query(
              `
                UPDATE password_reset_codes
                SET used_at = NOW()
                WHERE id = $1
              `,
              [
                resetRecordId,
              ],
            );
          } catch (
            cleanupError
          ) {
            console.error(
              'Unable to invalidate undelivered reset code:',
              cleanupError,
            );
          }
        }

        res
          .status(503)
          .json({
            message:
              'Password reset email is temporarily unavailable. Please try again shortly.',
          });

        return;
      }

      res.json(
        genericForgotPasswordResponse,
      );
    } catch (error) {
      console.error(
        'Forgot password error:',
        error,
      );

      res
        .status(500)
        .json({
          message:
            'Unable to process the password reset request at this time.',
        });
    }
  },
);

/*
 * ------------------------------------------------
 * POST /api/auth/reset-password
 * ------------------------------------------------
 *
 * Verifies one-time code and changes password.
 * ------------------------------------------------
 */

router.post(
  '/reset-password',

  async (
    req,
    res,
  ) => {
    const email =
      normalizeEmail(
        req.body?.email,
      );

    const code =
      typeof req.body?.code ===
      'string'
        ? req.body.code
            .trim()
        : '';

    const newPassword =
      typeof req.body?.newPassword ===
      'string'
        ? req.body.newPassword
        : '';

    if (!email) {
      res
        .status(400)
        .json({
          message:
            'Work email is required.',
        });

      return;
    }

    if (
      !isAllowedWorkEmail(
        email,
      )
    ) {
      res
        .status(403)
        .json({
          message:
            getAllowedEmailMessage(),
        });

      return;
    }

    if (
      !/^\d{6}$/.test(
        code,
      )
    ) {
      res
        .status(400)
        .json({
          message:
            'Please enter the 6-digit reset code.',
        });

      return;
    }

    if (
      newPassword.length <
      PASSWORD_MIN_LENGTH
    ) {
      res
        .status(400)
        .json({
          message:
            `Password must contain at least ${PASSWORD_MIN_LENGTH} characters.`,
        });

      return;
    }

    const client =
      await pool.connect();

    try {
      await client.query(
        'BEGIN',
      );

      const userResult =
        await client.query<{
          id:
            string;
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

      const user =
        userResult.rows[0];

      /*
       * Generic reset failure.
       */

      if (!user) {
        await client.query(
          'ROLLBACK',
        );

        res
          .status(400)
          .json({
            message:
              'Invalid or expired reset code.',
          });

        return;
      }

      const resetResult =
        await client.query<{
          id:
            string;

          code_hash:
            string;
        }>(
          `
            SELECT
              id,
              code_hash
            FROM password_reset_codes
            WHERE
              user_id = $1
              AND used_at IS NULL
              AND expires_at > NOW()
            ORDER BY
              created_at DESC
            LIMIT 1
            FOR UPDATE
          `,
          [
            user.id,
          ],
        );

      const resetRecord =
        resetResult.rows[0];

      if (!resetRecord) {
        await client.query(
          'ROLLBACK',
        );

        res
          .status(400)
          .json({
            message:
              'Invalid or expired reset code.',
          });

        return;
      }

      const validCode =
        await compare(
          code,
          resetRecord.code_hash,
        );

      if (!validCode) {
        await client.query(
          'ROLLBACK',
        );

        res
          .status(400)
          .json({
            message:
              'Invalid or expired reset code.',
          });

        return;
      }

      const passwordHash =
        await hash(
          newPassword,
          BCRYPT_ROUNDS,
        );

      await client.query(
        `
          UPDATE users
          SET
            password_hash = $1,
            updated_at = NOW()
          WHERE id = $2
        `,
        [
          passwordHash,
          user.id,
        ],
      );

      /*
       * Invalidate all reset codes for account.
       */

      await client.query(
        `
          UPDATE password_reset_codes
          SET used_at = NOW()
          WHERE
            user_id = $1
            AND used_at IS NULL
        `,
        [
          user.id,
        ],
      );

      await client.query(
        'COMMIT',
      );

      res.json({
        message:
          'Password updated successfully. You can now sign in with your new password.',
      });
    } catch (error) {
      try {
        await client.query(
          'ROLLBACK',
        );
      } catch {
        // Keep original error.
      }

      console.error(
        'Reset password error:',
        error,
      );

      res
        .status(500)
        .json({
          message:
            'Unable to reset your password at this time.',
        });
    } finally {
      client.release();
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
      res
        .status(401)
        .json({
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