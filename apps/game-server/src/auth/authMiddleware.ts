import type { NextFunction, Request, Response } from 'express';
import type { AuthenticatedIdentity, AuthVerifier } from './AuthVerifier.js';
import { AuthenticationError } from './AuthVerifier.js';

export type AuthenticatedRequest = Request & { identity?: AuthenticatedIdentity };

export function authMiddleware(verifier: AuthVerifier) {
  return async (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    const authorization = request.header('authorization');
    const token =
      authorization?.startsWith('Bearer ') === true ? authorization.slice(7).trim() : '';
    try {
      request.identity = await verifier.verifyAccessToken(token);
      next();
    } catch (error) {
      const code = error instanceof AuthenticationError ? error.code : 'AUTH_INVALID';
      response.status(401).json({
        error: {
          code,
          message: code === 'AUTH_EXPIRED' ? 'Your session expired.' : 'Authentication required.',
          requestId: response.locals.requestId ?? 'unknown',
        },
      });
    }
  };
}
