import { describe, expect, it } from 'vitest';
import { isMmoEligible, readMmoFeatureFlags } from '../../src/mmo/featureFlags';

describe('MMO feature flags', () => {
  it.each([{}, { MMO_WORLD_ENABLED: '0' }, { MMO_WORLD_ENABLED: 'true' }])(
    'keeps the MMO world disabled for %#',
    (environment) => {
      expect(readMmoFeatureFlags(environment)).toEqual({
        worldEnabled: false,
        allowAll: false,
        eligibleAccountIds: new Set(),
      });
    },
  );

  it('opens the MMO world to every account when enabled', () => {
    const flags = readMmoFeatureFlags({
      MMO_WORLD_ENABLED: '1',
      MMO_WORLD_ACCOUNT_IDS: ' account-b,account-a,account-b ',
    });

    expect([...flags.eligibleAccountIds]).toEqual(['account-a', 'account-b']);
    expect(flags.allowAll).toBe(true);
    expect(isMmoEligible('account-a', flags)).toBe(true);
    expect(isMmoEligible('account-c', flags)).toBe(true);
  });

  it('supports an explicit cohort fallback without requiring it for normal rollout', () => {
    const flags = readMmoFeatureFlags({ MMO_WORLD_ENABLED: '1', MMO_WORLD_ACCOUNT_IDS: '' });

    expect(flags.worldEnabled).toBe(true);
    expect(flags.allowAll).toBe(true);
    expect(isMmoEligible('account-a', flags)).toBe(true);
    const cohort = readMmoFeatureFlags({ MMO_WORLD_ENABLED: '1', MMO_WORLD_ALLOW_ALL: '0', MMO_WORLD_ACCOUNT_IDS: 'account-a' });
    expect(cohort.allowAll).toBe(false);
    expect(isMmoEligible('account-a', cohort)).toBe(true);
    expect(isMmoEligible('account-b', cohort)).toBe(false);
  });
});
