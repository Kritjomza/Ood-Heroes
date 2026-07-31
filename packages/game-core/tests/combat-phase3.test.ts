import { describe, expect, it } from 'vitest';
import {
  MONSTER_DEFINITIONS,
  SeededRandom,
  calculateAuthoritativeDamage,
  chooseHeroTarget,
  chooseMonsterTarget,
  contributionIsEligible,
  effectiveHeroPosition,
  expireStatusEffects,
  refreshMovementSlow,
  rewardIdentity,
} from '../src/index';

describe('Phase 3 deterministic combat', () => {
  it('defines all five Floor 1 monster behaviors and the required base balance', () => {
    expect(Object.keys(MONSTER_DEFINITIONS)).toEqual([
      'grumpy-radish',
      'jumping-sauce-bag',
      'shoe-biting-dust-ball',
      'wild-sausage',
      'lost-pudding',
    ]);
    expect(MONSTER_DEFINITIONS['grumpy-radish']).toMatchObject({
      baseMaxHp: 45,
      attack: 7,
      defense: 1,
      experienceReward: 20,
      goldReward: 5,
      respawnTicks: 100,
    });
    expect(MONSTER_DEFINITIONS['shoe-biting-dust-ball'].special).toBe('slow');
    expect(MONSTER_DEFINITIONS['wild-sausage'].special).toBe('charge');
    expect(MONSTER_DEFINITIONS['lost-pudding'].special).toBe('heal');
  });

  it('replays the same room-seeded random sequence and clamps unsafe damage inputs', () => {
    const first = new SeededRandom(12345);
    const second = new SeededRandom(12345);
    expect([first.next(), first.next(), first.next()]).toEqual([
      second.next(),
      second.next(),
      second.next(),
    ]);
    expect(calculateAuthoritativeDamage(20, 10, () => 0.5)).toBe(15);
    expect(calculateAuthoritativeDamage(Number.NaN, 10, () => 0.5)).toBe(0);
    expect(calculateAuthoritativeDamage(1, Infinity, () => 0.5)).toBe(0);
  });

  it('derives hero positions and applies stable hero and monster target priorities', () => {
    expect(effectiveHeroPosition({ x: 100, y: 100 }, 'right', 'support')).toEqual({
      x: 52,
      y: 142,
    });
    const monsters = [
      { id: 'near', distance: 20, alive: true, inSafeZone: false },
      { id: 'focus', distance: 80, alive: true, inSafeZone: false },
    ];
    expect(chooseHeroTarget(monsters, 'focus', null)?.id).toBe('focus');
    expect(chooseHeroTarget(monsters, null, 'focus')?.id).toBe('focus');
    expect(chooseHeroTarget(monsters, null, null)?.id).toBe('near');

    expect(
      chooseMonsterTarget([
        { id: 'fighter', role: 'fighter', distance: 100, valid: true },
        { id: 'tank', role: 'tank', distance: 112, valid: true },
        { id: 'safe', role: 'support', distance: 1, valid: false },
      ])?.id,
    ).toBe('tank');
  });

  it('refreshes one bounded slow, expires it by tick, and scopes eligibility by damage and time', () => {
    const once = refreshMovementSlow([], 'monster-1', 10, 40);
    const refreshed = refreshMovementSlow(once, 'monster-2', 20, 40);
    expect(refreshed).toHaveLength(1);
    expect(refreshed[0]).toMatchObject({ magnitude: 0.2, startTick: 20, expirationTick: 60 });
    expect(expireStatusEffects(refreshed, 59)).toHaveLength(1);
    expect(expireStatusEffects(refreshed, 60)).toEqual([]);
    expect(contributionIsEligible({ damageDealt: 1, lastContributionTick: 100 }, 45, 300)).toBe(
      true,
    );
    expect(contributionIsEligible({ damageDealt: 0, lastContributionTick: 300 }, 45, 300)).toBe(
      false,
    );
    expect(contributionIsEligible({ damageDealt: 10, lastContributionTick: 99 }, 45, 300)).toBe(
      false,
    );
    expect(rewardIdentity('room', 'spawn-1', 3)).toBe('room:spawn-1:3');
  });
});
