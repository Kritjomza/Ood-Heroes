import type { DomainErrorCode } from '@odd-tower/network-protocol';

export class GameApiError extends Error {
  constructor(
    readonly code: DomainErrorCode,
    readonly requestId: string,
    message: string,
  ) {
    super(message);
    this.name = 'GameApiError';
  }
}
