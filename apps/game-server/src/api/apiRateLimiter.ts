import type { NextFunction, Request, Response } from 'express';
import type { AuthenticatedRequest } from '../auth/authMiddleware.js';

export class ApiRateLimiter {
  readonly #windows = new Map<string, { startedAt: number; count: number }>();

  constructor(
    private readonly limit = 60,
    private readonly windowMs = 60_000,
    private readonly maxKeys = 2_000,
  ) {}

  middleware = (request: Request, response: Response, next: NextFunction) => {
    const identity = (request as AuthenticatedRequest).identity;
    const key = identity?.userId ?? request.ip ?? 'unknown';
    const now = Date.now();
    let window = this.#windows.get(key);
    if (!window || now - window.startedAt >= this.windowMs) {
      window = { startedAt: now, count: 0 };
      this.#windows.set(key, window);
    }
    window.count += 1;
    if (this.#windows.size > this.maxKeys) this.#windows.delete(this.#windows.keys().next().value!);
    if (window.count > this.limit) {
      response.status(429).json({
        error: {
          code: 'RATE_LIMITED',
          message: 'Please wait before trying again.',
          requestId: response.locals.requestId,
        },
      });
      return;
    }
    next();
  };
}
