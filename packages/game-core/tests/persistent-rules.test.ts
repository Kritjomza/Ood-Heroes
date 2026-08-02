import { describe, expect, it } from 'vitest';
import {
  HERO_DEFINITIONS,
  SUMMON_WEIGHTS,
  advancePity,
  calculateAfkReward,
  duplicateShardReward,
  isPityPull,
  starUpgradeCost,
  teamSlotEligibility,
} from '../src/index';

describe('persistent collection and economy rules', () => {
  it('defines exactly six unique heroes and only the required three starters', () => {
    expect(HERO_DEFINITIONS.map((hero) => hero.id)).toEqual([
      'hero_001_grilled_chicken',
      'hero_002_pink_chocolate_lizard',
      'hero_003_robot_jelly',
      'hero_004_tofu_rabbit',
      'hero_005_accountant_octopus',
      'hero_006_samurai_bread',
    ]);
    expect(HERO_DEFINITIONS.filter((hero) => hero.starterEligible).map((hero) => hero.id)).toEqual([
      'hero_001_grilled_chicken',
      'hero_003_robot_jelly',
      'hero_004_tofu_rabbit',
    ]);
    expect(new Set(HERO_DEFINITIONS.map((hero) => hero.assetKey)).size).toBe(6);
  });

  it('uses integer summon weights matching the approved rates', () => {
    expect(SUMMON_WEIGHTS).toEqual({
      hero_001_grilled_chicken: 2750,
      hero_002_pink_chocolate_lizard: 1500,
      hero_003_robot_jelly: 2750,
      hero_004_tofu_rabbit: 1500,
      hero_005_accountant_octopus: 1200,
      hero_006_samurai_bread: 300,
    });
  });

  it('guarantees the twentieth pull after nineteen non-epic pulls and resets on epic or better', () => {
    expect(isPityPull(18)).toBe(false);
    expect(isPityPull(19)).toBe(true);
    expect(advancePity(19, 'rare')).toBe(20);
    expect(advancePity(12, 'epic')).toBe(0);
    expect(advancePity(12, 'legendary')).toBe(0);
  });

  it.each([
    ['common', 10],
    ['rare', 15],
    ['epic', 30],
    ['legendary', 60],
  ] as const)('converts a %s duplicate into %i Shards', (rarity, expected) => {
    expect(duplicateShardReward(rarity)).toBe(expected);
  });

  it.each([
    [1, 20],
    [2, 50],
    [3, 100],
    [4, 200],
    [5, null],
  ])('maps %i Stars to the next upgrade cost', (stars, expected) => {
    expect(starUpgradeCost(stars)).toBe(expected);
  });

  it('derives team-slot eligibility from unique ownership and Gold', () => {
    expect(teamSlotEligibility({ ownedHeroCount: 1, teamSlots: 1, gold: 900 })).toEqual({
      canUseSlot2: false,
      canUnlockSlot3: false,
    });
    expect(teamSlotEligibility({ ownedHeroCount: 2, teamSlots: 1, gold: 900 })).toEqual({
      canUseSlot2: true,
      canUnlockSlot3: false,
    });
    expect(teamSlotEligibility({ ownedHeroCount: 3, teamSlots: 2, gold: 499 })).toEqual({
      canUseSlot2: true,
      canUnlockSlot3: false,
    });
    expect(teamSlotEligibility({ ownedHeroCount: 3, teamSlots: 2, gold: 500 })).toEqual({
      canUseSlot2: true,
      canUnlockSlot3: true,
    });
  });
});

describe('trusted AFK interval rules', () => {
  const minute = 60_000;

  it.each([
    [9, { rewardedMinutes: 0, gold: 0, diamonds: 0, shards: 0 }],
    [10, { rewardedMinutes: 10, gold: 80, diamonds: 10, shards: 3 }],
    [19, { rewardedMinutes: 10, gold: 80, diamonds: 10, shards: 3 }],
    [20, { rewardedMinutes: 20, gold: 160, diamonds: 20, shards: 6 }],
    [29, { rewardedMinutes: 20, gold: 160, diamonds: 20, shards: 6 }],
    [30, { rewardedMinutes: 30, gold: 250, diamonds: 35, shards: 10 }],
    [600, { rewardedMinutes: 30, gold: 250, diamonds: 35, shards: 10 }],
  ])('%i offline minutes yields the exact capped reward', (offlineMinutes, expected) => {
    const nowMs = 1_000_000 + offlineMinutes * minute;
    const result = calculateAfkReward({
      lastSettledAtMs: 1_000_000,
      nowMs,
    });
    expect(result).toEqual({ ...expected, settledThroughMs: nowMs });
  });

  it('rejects a client-style clock that predates the trusted settlement cursor', () => {
    expect(() => calculateAfkReward({ lastSettledAtMs: 2_000, nowMs: 1_999 })).toThrow(
      'INVALID_AFK_TIME_RANGE',
    );
  });
});
