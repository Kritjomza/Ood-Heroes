import { describe, expect, it } from 'vitest';
import {
  PROTOCOL_VERSION,
  validateAuthenticatedJoinOptions,
  validateMutationEnvelope,
  validatePlayerBootstrap,
} from '../src/index';

const validBootstrap = {
  contractVersion: 1,
  schemaVersion: 1,
  serverTime: '2026-07-31T00:00:00.000Z',
  profile: {
    userId: 'd9428888-122b-11e1-b85c-61cd3cbb3210',
    displayName: 'Traveler',
    accountKind: 'guest',
    teamSlots: 1,
    onboardingStep: 0,
  },
  currencies: {
    gold: 500,
    gem: 300,
    upgradeJelly: 0,
  },
  heroDefinitions: [],
  heroes: [],
  activeTeam: {
    id: '9b2a5b7e-6c30-4d44-9d4f-c286bf5f5d38',
    name: 'Main Team',
    slots: [],
  },
  banner: {
    id: 'standard_odd_heroes',
    displayName: 'Odd Hero Summon',
    gemCost: 100,
    pityThreshold: 20,
    pullsSinceEpic: 0,
    totalPulls: 0,
  },
  pendingAfkClaim: null,
  persistence: {
    status: 'healthy',
    queueDepth: 0,
  },
};

describe('Phase 4 persistence validation', () => {
  it('accepts an authenticated room join without client-owned identity or hero data', () => {
    const input = {
      accessToken: 'header.payload.signature',
      protocolVersion: PROTOCOL_VERSION,
    };

    expect(validateAuthenticatedJoinOptions(input)).toEqual({ ok: true, value: input });
  });

  it('rejects a room join when the access token is empty', () => {
    expect(
      validateAuthenticatedJoinOptions({
        accessToken: '',
        protocolVersion: PROTOCOL_VERSION,
      }),
    ).toEqual({ ok: false, code: 'AUTH_REQUIRED' });
  });

  it('rejects client-owned identity fields in authenticated room joins', () => {
    expect(
      validateAuthenticatedJoinOptions({
        accessToken: 'header.payload.signature',
        protocolVersion: PROTOCOL_VERSION,
        userId: 'd9428888-122b-11e1-b85c-61cd3cbb3210',
      }),
    ).toEqual({ ok: false, code: 'AUTH_INVALID' });
  });

  it('accepts a mutation envelope only with a UUID idempotency key and object payload', () => {
    const input = {
      idempotencyKey: '2f1d0b98-7310-4f9b-b1aa-7d5f43a9bc9d',
      payload: { bannerId: 'standard_odd_heroes' },
    };

    expect(validateMutationEnvelope(input)).toEqual({ ok: true, value: input });
    expect(
      validateMutationEnvelope({
        idempotencyKey: 'not-a-uuid',
        payload: {},
      }),
    ).toEqual({ ok: false, code: 'IDEMPOTENCY_REQUIRED' });
  });

  it('accepts a complete versioned bootstrap payload', () => {
    expect(validatePlayerBootstrap(validBootstrap)).toEqual({
      ok: true,
      value: validBootstrap,
    });
  });

  it('rejects negative authoritative currency balances', () => {
    expect(
      validatePlayerBootstrap({
        ...validBootstrap,
        currencies: { ...validBootstrap.currencies, gem: -1 },
      }),
    ).toEqual({ ok: false, code: 'SCHEMA_VERSION_MISMATCH' });
  });

  it('rejects an unsupported bootstrap schema version', () => {
    expect(validatePlayerBootstrap({ ...validBootstrap, schemaVersion: 2 })).toEqual({
      ok: false,
      code: 'SCHEMA_VERSION_MISMATCH',
    });
  });
});
