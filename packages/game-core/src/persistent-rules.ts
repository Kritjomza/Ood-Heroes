import type { HeroRarity } from './hero-definitions.js';

const DUPLICATE_SHARDS: Record<HeroRarity, number> = {
  common: 10,
  rare: 15,
  epic: 30,
  legendary: 60,
};

const STAR_COSTS = [20, 50, 100, 200] as const;
const MINUTE_MS = 60 * 1000;

export const duplicateShardReward = (rarity: HeroRarity) => DUPLICATE_SHARDS[rarity];

export const isPityPull = (pullsSinceEpic: number) => pullsSinceEpic >= 19;

export const advancePity = (pullsSinceEpic: number, rarity: HeroRarity) =>
  rarity === 'epic' || rarity === 'legendary' ? 0 : pullsSinceEpic + 1;

export function starUpgradeCost(stars: number) {
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) throw new Error('INVALID_HERO_STARS');
  return stars === 5 ? null : STAR_COSTS[stars - 1]!;
}

export function teamSlotEligibility(input: {
  ownedHeroCount: number;
  teamSlots: number;
  gold: number;
}) {
  const canUseSlot2 = input.ownedHeroCount >= 2;
  return {
    canUseSlot2,
    canUnlockSlot3:
      canUseSlot2 && input.ownedHeroCount >= 3 && input.teamSlots >= 2 && input.gold >= 500,
  };
}

export function calculateAfkReward(input: { lastSettledAtMs: number; nowMs: number }) {
  if (
    !Number.isSafeInteger(input.lastSettledAtMs) ||
    !Number.isSafeInteger(input.nowMs) ||
    input.nowMs < input.lastSettledAtMs
  )
    throw new Error('INVALID_AFK_TIME_RANGE');
  const elapsedMinutes = Math.floor((input.nowMs - input.lastSettledAtMs) / MINUTE_MS);
  const reward =
    elapsedMinutes >= 30
      ? { rewardedMinutes: 30 as const, gold: 250, diamonds: 35, shards: 10 }
      : elapsedMinutes >= 20
        ? { rewardedMinutes: 20 as const, gold: 160, diamonds: 20, shards: 6 }
        : elapsedMinutes >= 10
          ? { rewardedMinutes: 10 as const, gold: 80, diamonds: 10, shards: 3 }
          : { rewardedMinutes: 0 as const, gold: 0, diamonds: 0, shards: 0 };
  return {
    ...reward,
    settledThroughMs: input.nowMs,
  };
}
