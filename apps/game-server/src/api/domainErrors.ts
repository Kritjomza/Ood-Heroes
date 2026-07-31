import type { DomainErrorCode } from '@odd-tower/network-protocol';

const DOMAIN_CODES = new Set<DomainErrorCode>([
  'AUTH_REQUIRED',
  'AUTH_INVALID',
  'AUTH_EXPIRED',
  'PROFILE_NOT_FOUND',
  'PROFILE_INITIALIZATION_FAILED',
  'DISPLAY_NAME_INVALID',
  'PLAYER_ALREADY_CONNECTED',
  'PERSISTENCE_UNAVAILABLE',
  'PERSISTENCE_DEGRADED',
  'IDEMPOTENCY_REQUIRED',
  'INSUFFICIENT_GEMS',
  'INSUFFICIENT_GOLD',
  'INSUFFICIENT_SHARDS',
  'HERO_NOT_OWNED',
  'HERO_ALREADY_MAX_STARS',
  'TEAM_SLOT_LOCKED',
  'TEAM_INVALID',
  'ACTIVE_COMBAT_RESTRICTION',
  'BANNER_NOT_FOUND',
  'BANNER_DISABLED',
  'AFK_CLAIM_NOT_FOUND',
  'AFK_ALREADY_CLAIMED',
  'RATE_LIMITED',
  'SCHEMA_VERSION_MISMATCH',
  'SERVER_ERROR',
]);

export class DomainError extends Error {
  constructor(
    readonly code: DomainErrorCode,
    readonly status: number = statusForCode(code),
  ) {
    super(code);
    this.name = 'DomainError';
  }
}

export function mapPersistenceError(error: unknown): DomainError {
  if (error instanceof DomainError) return error;
  const message =
    typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : '';
  for (const code of DOMAIN_CODES) if (message.includes(code)) return new DomainError(code);
  return new DomainError('PERSISTENCE_UNAVAILABLE', 503);
}

function statusForCode(code: DomainErrorCode) {
  if (code.startsWith('AUTH_')) return 401;
  if (code === 'PROFILE_NOT_FOUND' || code === 'BANNER_NOT_FOUND') return 404;
  if (code === 'RATE_LIMITED') return 429;
  if (code === 'PERSISTENCE_UNAVAILABLE' || code === 'PERSISTENCE_DEGRADED') return 503;
  if (code === 'SERVER_ERROR') return 500;
  return 409;
}

export function safeMessage(code: DomainErrorCode) {
  const messages: Partial<Record<DomainErrorCode, string>> = {
    INSUFFICIENT_GEMS: 'You need more Gems.',
    INSUFFICIENT_GOLD: 'You need more Gold.',
    INSUFFICIENT_SHARDS: 'You need more Hero Shards.',
    HERO_NOT_OWNED: 'That Hero is not in your collection.',
    TEAM_SLOT_LOCKED: 'That team slot is still locked.',
    PERSISTENCE_UNAVAILABLE: 'Saving is temporarily unavailable.',
    ACTIVE_COMBAT_RESTRICTION: 'Leave combat before changing progression.',
  };
  return messages[code] ?? 'The request could not be completed.';
}
