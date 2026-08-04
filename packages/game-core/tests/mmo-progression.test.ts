import { describe, expect, it } from 'vitest';
import { adventureRankCap, grantEncounterXp, useHeroXpItem } from '../src/index.js';

const heroes = [
  { id: 'leader', level: 1, experience: 0 },
  { id: 'reserve', level: 1, experience: 0 },
  { id: 'veteran', level: 5, experience: 0 },
];

describe('MMO dual progression', () => {
  it('gives deployed heroes full XP and reserve heroes partial catch-up XP', () => {
    const result = grantEncounterXp({ rank: 1, experience: 0 }, heroes, ['leader'], ['reserve'], 100);
    expect(result.deployedXp).toBe(150);
    expect(result.reserveXp).toBe(52);
    expect(result.heroes.find((hero) => hero.id === 'leader')!.level).toBeGreaterThan(1);
    expect(result.heroes.find((hero) => hero.id === 'reserve')!.level).toBeGreaterThan(1);
  });

  it('caps hero levels by Adventure Rank and advances the account rank independently', () => {
    expect(adventureRankCap(1)).toBe(5);
    const result = grantEncounterXp({ rank: 1, experience: 0 }, heroes, ['leader', 'reserve', 'veteran'], [], 10_000);
    expect(result.adventure.rank).toBeGreaterThan(1);
    expect(result.heroes.every((hero) => hero.level <= result.heroLevelCap)).toBe(true);
  });

  it('uses XP items without exceeding the current Adventure Rank cap', () => {
    const result = useHeroXpItem({ id: 'hero', level: 1, experience: 0 }, 10_000, { rank: 1, experience: 0 });
    expect(result.level).toBe(adventureRankCap(1));
    expect(result.experience).toBe(0);
  });
});
