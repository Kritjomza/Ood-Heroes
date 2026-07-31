import { describe, expect, it } from 'vitest';
import {
  HERO_DEFINITIONS,
  effectiveHeroStats,
  levelFromTotalExperience,
  totalExperienceCap,
} from '../src/index';

describe('persistent hero progression', () => {
  it.each([
    [0, 1],
    [49, 1],
    [50, 2],
    [176, 2],
    [177, 3],
    [22_863, 19],
    [22_864, 20],
    [99_999_999, 20],
  ])('derives level %i experience as %i', (totalExperience, expectedLevel) => {
    expect(levelFromTotalExperience(totalExperience)).toBe(expectedLevel);
  });

  it('rejects invalid persisted experience instead of deriving a misleading level', () => {
    expect(() => levelFromTotalExperience(-1)).toThrow('INVALID_TOTAL_EXPERIENCE');
    expect(() => levelFromTotalExperience(Number.MAX_SAFE_INTEGER + 1)).toThrow(
      'INVALID_TOTAL_EXPERIENCE',
    );
  });

  it('exposes the exact cumulative experience ceiling for level 20', () => {
    expect(totalExperienceCap()).toBe(22_864);
  });

  it('applies existing level growth before the star multiplier with deterministic rounding', () => {
    const definition = HERO_DEFINITIONS.find(
      (candidate) => candidate.id === 'hero_001_grilled_chicken',
    )!;

    expect(effectiveHeroStats(definition, 50, 2)).toEqual({
      level: 2,
      maxHp: 131,
      attack: 21,
      defense: 4,
      moveSpeed: 120,
      attackRange: 52,
      attackCooldownMs: 800,
    });
  });

  it('rejects Stars outside the persistent one-to-five range', () => {
    const definition = HERO_DEFINITIONS[0]!;
    expect(() => effectiveHeroStats(definition, 0, 0)).toThrow('INVALID_HERO_STARS');
    expect(() => effectiveHeroStats(definition, 0, 6)).toThrow('INVALID_HERO_STARS');
  });
});
