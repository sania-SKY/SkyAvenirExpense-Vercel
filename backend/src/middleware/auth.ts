import type {
    NextFunction,
    Request,
    Response,
} from 'express';

import {
    createRemoteJWKSet,
    jwtVerify,
} from 'jose';

import { env } from '../config/env.js';

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (env.authMode === 'mock') {
      req.user = {
        id: 'mock-user-001',
        name: 'Sky Avenir Employee',
        email: 'employee@skyavenir.com',
      };

      next();
      return;
    }

    const authorization = req.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      res.status(401).json({
        message: 'Authentication required.',
      });

      return;
    }

    const token = authorization.substring(7);

    if (
      !env.microsoft.tenantId ||
      !env.microsoft.clientId
    ) {
      res.status(500).json({
        message:
          'Microsoft authentication is not configured.',
      });

      return;
    }

    const issuer =
      `https://login.microsoftonline.com/` +
      `${env.microsoft.tenantId}/v2.0`;

    const jwksUrl = new URL(
      `https://login.microsoftonline.com/` +
      `${env.microsoft.tenantId}/discovery/v2.0/keys`,
    );

    const JWKS = createRemoteJWKSet(jwksUrl);

    const { payload } = await jwtVerify(
      token,
      JWKS,
      {
        issuer,
        audience: env.microsoft.clientId,
      },
    );

    const id =
      typeof payload.oid === 'string'
        ? payload.oid
        : payload.sub;

    const name =
      typeof payload.name === 'string'
        ? payload.name
        : 'Sky Avenir Employee';

    const email =
      typeof payload.preferred_username === 'string'
        ? payload.preferred_username
        : '';

    if (!id) {
      res.status(401).json({
        message: 'Invalid user identity.',
      });

      return;
    }

    req.user = {
      id,
      name,
      email,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);

    res.status(401).json({
      message: 'Invalid or expired authentication.',
    });
  }
}