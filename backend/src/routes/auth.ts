import {
  Router,
} from 'express';

import {
  OAuth2Client,
} from 'google-auth-library';

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
  resolveUserId,
} from '../services/userService.js';

import type {
  AuthenticatedUser,
  AuthProvider,
} from '../middleware/auth.js';

const router = Router();

const googleClient =
  new OAuth2Client(
    env.google.webClientId,
  );

function getSessionSecret() {
  if (!env.appSessionSecret) {
    throw new Error(
      'APP_SESSION_SECRET is not configured.',
    );
  }

  return new TextEncoder().encode(
    env.appSessionSecret,
  );
}

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
      alg: 'HS256',
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

router.get(
  '/me',
  async (_req, res) => {
    /*
     * TEMPORARY Microsoft showcase route.
     * This is NOT real Microsoft authentication.
     */
    res.status(501).json({
      authenticated: false,
      message:
        'Microsoft authentication is not configured yet.',
    });
  },
);

router.post(
  '/google',
  async (req, res) => {
    try {
      const idToken =
        typeof req.body?.idToken ===
        'string'
          ? req.body.idToken.trim()
          : '';

      if (!idToken) {
        res.status(400).json({
          authenticated: false,
          message:
            'Google ID token is required.',
        });

        return;
      }

      if (
        !env.google.webClientId
      ) {
        res.status(500).json({
          authenticated: false,
          message:
            'Google authentication is not configured.',
        });

        return;
      }

      const ticket =
        await googleClient
          .verifyIdToken({
            idToken,

            audience:
              env.google.webClientId,
          });

      const payload =
        ticket.getPayload();

      if (!payload) {
        res.status(401).json({
          authenticated: false,
          message:
            'Invalid Google identity.',
        });

        return;
      }

      const providerUserId =
        payload.sub;

      const email =
        payload.email
          ?.trim()
          .toLowerCase();

      const name =
        payload.name
          ?.trim();

      if (
        !providerUserId ||
        !email ||
        !payload.email_verified
      ) {
        res.status(401).json({
          authenticated: false,
          message:
            'Google account could not be verified.',
        });

        return;
      }

      /*
       * Internal Sky Avenir account restriction.
       */
      if (
        !email.endsWith(
          '@skyavenir.com',
        )
      ) {
        res.status(403).json({
          authenticated: false,
          message:
            'Please use your Sky Avenir work account.',
        });

        return;
      }

      const authenticatedUser:
        AuthenticatedUser = {
          provider:
            'google',

          providerUserId,

          name:
            name ||
            email.split('@')[0],

          email,
        };

      const client =
        await pool.connect();

      let databaseUserId:
        string;

      try {
        await client.query(
          'BEGIN',
        );

        databaseUserId =
          await resolveUserId(
            client,
            authenticatedUser,
          );

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

      const accessToken =
        await createSessionToken(
          databaseUserId,
          authenticatedUser,
        );

      res.json({
        authenticated: true,

        accessToken,

        user: {
          id:
            databaseUserId,

          provider:
            'google' as AuthProvider,

          providerUserId,

          name:
            authenticatedUser.name,

          email,
        },
      });
    } catch (error) {
      console.error(
        'Google authentication failed:',
        error,
      );

      res.status(401).json({
        authenticated: false,
        message:
          'Google authentication failed.',
      });
    }
  },
);

export default router;