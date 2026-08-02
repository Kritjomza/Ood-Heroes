import { PROTOCOL_VERSION } from './config.js';
import { DATA_CONTRACT_VERSION, DATA_SCHEMA_VERSION } from './persistence-config.js';
import type {
  AuthenticatedJoinOptions,
  MutationEnvelope,
  PersistenceValidationResult,
  PlayerBootstrap,
  SummonResult,
} from './persistence-types.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonNegativeSafeInteger = (value: unknown): value is number =>
  Number.isSafeInteger(value) && (value as number) >= 0;

const hasExactKeys = (value: Record<string, unknown>, keys: readonly string[]) => {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
};

export function validateAuthenticatedJoinOptions(
  value: unknown,
): PersistenceValidationResult<AuthenticatedJoinOptions> {
  if (!isRecord(value) || !hasExactKeys(value, ['accessToken', 'protocolVersion']))
    return { ok: false, code: 'AUTH_INVALID' };
  if (typeof value.accessToken !== 'string' || value.accessToken.trim().length === 0)
    return { ok: false, code: 'AUTH_REQUIRED' };
  if (value.protocolVersion !== PROTOCOL_VERSION)
    return { ok: false, code: 'SCHEMA_VERSION_MISMATCH' };
  return {
    ok: true,
    value: { accessToken: value.accessToken, protocolVersion: value.protocolVersion },
  };
}

export function validateMutationEnvelope(
  value: unknown,
): PersistenceValidationResult<MutationEnvelope> {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, ['idempotencyKey', 'payload']) ||
    typeof value.idempotencyKey !== 'string' ||
    !UUID_PATTERN.test(value.idempotencyKey) ||
    !isRecord(value.payload)
  )
    return { ok: false, code: 'IDEMPOTENCY_REQUIRED' };
  return {
    ok: true,
    value: { idempotencyKey: value.idempotencyKey, payload: value.payload },
  };
}

export function validatePlayerBootstrap(
  value: unknown,
): PersistenceValidationResult<PlayerBootstrap> {
  if (
    !isRecord(value) ||
    value.contractVersion !== DATA_CONTRACT_VERSION ||
    value.schemaVersion !== DATA_SCHEMA_VERSION ||
    typeof value.serverTime !== 'string' ||
    !Number.isFinite(Date.parse(value.serverTime)) ||
    !isValidProfile(value.profile) ||
    !isValidCurrencies(value.currencies) ||
    !Array.isArray(value.heroDefinitions) ||
    !Array.isArray(value.heroes) ||
    !isValidTeam(value.activeTeam) ||
    !isValidBanner(value.banner) ||
    !isValidAfkClaim(value.pendingAfkClaim) ||
    !isValidPersistence(value.persistence)
  )
    return { ok: false, code: 'SCHEMA_VERSION_MISMATCH' };
  return { ok: true, value: value as PlayerBootstrap };
}

function isValidAfkClaim(value: unknown) {
  if (value === null) return true;
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    UUID_PATTERN.test(value.id) &&
    (value.rewardedMinutes === 10 ||
      value.rewardedMinutes === 20 ||
      value.rewardedMinutes === 30) &&
    typeof value.periodStart === 'string' &&
    Number.isFinite(Date.parse(value.periodStart)) &&
    typeof value.periodEnd === 'string' &&
    Number.isFinite(Date.parse(value.periodEnd)) &&
    isNonNegativeSafeInteger(value.gold) &&
    isNonNegativeSafeInteger(value.diamonds) &&
    isNonNegativeSafeInteger(value.shardsPerActiveHero) &&
    Array.isArray(value.recipientHeroIds) &&
    value.recipientHeroIds.length > 0 &&
    value.recipientHeroIds.every((id) => typeof id === 'string' && UUID_PATTERN.test(id))
  );
}

export function validateSummonResult(value: unknown): PersistenceValidationResult<SummonResult> {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      'outcomeType',
      'heroDefinitionId',
      'heroDisplayName',
      'heroRarity',
      'shardsAwarded',
      'gemCost',
      'gemBalance',
      'pityBefore',
      'pityAfter',
      'alreadyApplied',
    ]) ||
    (value.outcomeType !== 'new_hero' && value.outcomeType !== 'duplicate') ||
    typeof value.heroDefinitionId !== 'string' ||
    value.heroDefinitionId.length === 0 ||
    typeof value.heroDisplayName !== 'string' ||
    value.heroDisplayName.length === 0 ||
    !['common', 'rare', 'epic', 'legendary'].includes(String(value.heroRarity)) ||
    !isNonNegativeSafeInteger(value.shardsAwarded) ||
    !isNonNegativeSafeInteger(value.gemCost) ||
    !isNonNegativeSafeInteger(value.gemBalance) ||
    !isNonNegativeSafeInteger(value.pityBefore) ||
    !isNonNegativeSafeInteger(value.pityAfter) ||
    typeof value.alreadyApplied !== 'boolean'
  )
    return { ok: false, code: 'SCHEMA_VERSION_MISMATCH' };
  return { ok: true, value: value as SummonResult };
}

function isValidProfile(value: unknown) {
  return (
    isRecord(value) &&
    typeof value.userId === 'string' &&
    UUID_PATTERN.test(value.userId) &&
    typeof value.displayName === 'string' &&
    value.displayName.trim().length > 0 &&
    (value.accountKind === 'guest' || value.accountKind === 'permanent') &&
    Number.isInteger(value.teamSlots) &&
    (value.teamSlots as number) >= 1 &&
    (value.teamSlots as number) <= 3 &&
    isNonNegativeSafeInteger(value.onboardingStep)
  );
}

function isValidCurrencies(value: unknown) {
  return (
    isRecord(value) &&
    isNonNegativeSafeInteger(value.gold) &&
    isNonNegativeSafeInteger(value.gem) &&
    isNonNegativeSafeInteger(value.upgradeJelly)
  );
}

function isValidTeam(value: unknown) {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    UUID_PATTERN.test(value.id) &&
    typeof value.name === 'string' &&
    value.name.length > 0 &&
    Array.isArray(value.slots)
  );
}

function isValidBanner(value: unknown) {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.displayName === 'string' &&
    isNonNegativeSafeInteger(value.gemCost) &&
    isNonNegativeSafeInteger(value.pityThreshold) &&
    isNonNegativeSafeInteger(value.pullsSinceEpic) &&
    isNonNegativeSafeInteger(value.totalPulls)
  );
}

function isValidPersistence(value: unknown) {
  return (
    isRecord(value) &&
    (value.status === 'healthy' || value.status === 'degraded' || value.status === 'unavailable') &&
    isNonNegativeSafeInteger(value.queueDepth)
  );
}
