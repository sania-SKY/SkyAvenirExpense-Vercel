import type {
  NextFunction,
  Request,
  Response,
} from 'express';

import {
  jwtVerify,
} from 'jose';

import {
  env,
} from '../config/env.js';

export type AuthProvider =
  'email';

export type AuthenticatedUser = {
  id?: string;

  provider:
    AuthProvider;

  providerUserId:
    string;

  name:
    string;

  email:
    string;
};

declare global {
  namespace Express {
    interface Request {
      user?:
        AuthenticatedUser;
    }
  }
}

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

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authorization =
      req.headers.authorization;

    if (
      !authorization ||
      !authorization.startsWith(
        'Bearer ',
      )
    ) {
      res.status(
        401,
      ).json({
        message:
          'Authentication required.',
      });

      return;
    }

    const token =
      authorization
        .substring(7)
        .trim();

    if (!token) {
      res.status(
        401,
      ).json({
        message:
          'Authentication required.',
      });

      return;
    }

    const {
      payload,
    } =
      await jwtVerify(
        token,
        getSessionSecret(),
        {
          issuer:
            'sky-avenir-expense-api',

          audience:
            'sky-avenir-expense-app',
        },
      );

    const provider =
      payload.provider;

    const providerUserId =
      payload.providerUserId;

    const name =
      payload.name;

    const email =
      payload.email;

    if (
      provider !==
        'email' ||
      typeof providerUserId !==
        'string' ||
      typeof name !==
        'string' ||
      typeof email !==
        'string'
    ) {
      res.status(
        401,
      ).json({
        message:
          'Invalid authentication session.',
      });

      return;
    }

    req.user = {
      id:
        typeof payload.sub ===
        'string'
          ? payload.sub
          : undefined,

      provider:
        'email',

      providerUserId,

      name,

      email:
        email
          .trim()
          .toLowerCase(),
    };

    next();
  } catch (error) {
    console.error(
      'Authentication error:',
      error,
    );

    res.status(
      401,
    ).json({
      message:
        'Invalid or expired authentication.',
    });
  }
}