import { describe, expect, it } from 'vitest';
import { isMmoEligible, readMmoFeatureFlags } from '../../src/mmo/featureFlags';

describe('MMO feature flags', () => {
  it.each([{}, { MMO_WORLD_ENABLED: '0' }, { MMO_WORLD_ENABLED: 'true' }])(
    'keeps the MMO world disabled for %#',
    (environment) => {
      expect(readMmoFeatureFlags(environment)).toEqual({
        worldEnabled: false,
        eligibleAccountIds: new Set(),
      });
    },
  );

  it('normalizes a bounded account cohort when explicitly enabled', () => {
    const flags = readMmoFeatureFlags({
      MMO_WORLD_ENABLED: '1',
      MMO_WORLD_ACCOUNT_IDS: ' account-b,account-a,account-b ',
    });

    expect([...flags.eligibleAccountIds]).toEqual(['account-a', 'account-b']);
    expect(isMmoEligible('account-a', flags)).toBe(true);
    expect(isMmoEligible('account-c', flags)).toBe(false);
  });

  it('does not treat an empty cohort as permission for every account', () => {
    const flags = readMmoFeatureFlags({ MMO_WORLD_ENABLED: '1', MMO_WORLD_ACCOUNT_IDS: '' });

    expect(flags.worldEnabled).toBe(true);
    expect(isMmoEligible('account-a', flags)).toBe(false);
  });
});
