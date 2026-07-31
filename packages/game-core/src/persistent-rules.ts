import type { HeroRarity } from './hero-definitions.js';

const DUPLICATE_SHARDS: Record<HeroRarity, number> = {
  common: 10,
  rare: 15,
  epic: 30,
  legendary: 60,
};

const STAR_COSTS = [20, 50, 100, 200] as const;
const AFK_INTERVAL_MS = 30 * 60 * 1000;
const AFK_MAX_INTERVALS = 16;

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

export function calculateAfkIntervals(input: { lastSettledAtMs: number; nowMs: number }) {
  if (
    !Number.isSafeInteger(input.lastSettledAtMs) ||
    !Number.isSafeInteger(input.nowMs) ||
    input.nowMs < input.lastSettledAtMs
  )
    throw new Error('INVALID_AFK_TIME_RANGE');
  const elapsedMs = input.nowMs - input.lastSettledAtMs;
  const completeIntervals = Math.floor(elapsedMs / AFK_INTERVAL_MS);
  const remainderMs = elapsedMs % AFK_INTERVAL_MS;
  return {
    intervalCount: Math.min(completeIntervals, AFK_MAX_INTERVALS),
    remainderMs,
    settledThroughMs: input.nowMs - remainderMs,
  };
}
