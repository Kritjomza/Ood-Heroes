import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export function requestContext(_request: Request, response: Response, next: NextFunction) {
  response.locals.requestId = randomUUID();
  response.setHeader('x-request-id', response.locals.requestId);
  next();
}
