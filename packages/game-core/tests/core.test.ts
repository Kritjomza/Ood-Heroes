import { describe, expect, it } from 'vitest';
import {
  applyExperience,
  calculateDamage,
  canAttack,
  formationDestination,
  findPath,
  shouldRecoverFollower,
  requiredExperienceForNextLevel,
} from '../src/index';
describe('combat', () => {
  it('enforces minimum damage and deterministic RNG', () => {
    expect(calculateDamage(1, 999, () => 0)).toBe(1);
    expect(calculateDamage(20, 10, () => 0.5)).toBe(15);
  });
  it('enforces cooldowns', () => {
    expect(canAttack(1000, 500, 600)).toBe(false);
    expect(canAttack(1100, 500, 600)).toBe(true);
  });
});
describe('progression', () => {
  it('uses the configured curve', () => expect(requiredExperienceForNextLevel(1)).toBe(50));
  it('supports multiple levels, growth, hp gain, and cap', () => {
    const result = applyExperience(
      { level: 1, experience: 0, maxHp: 100, currentHp: 40, attack: 10, defense: 10 },
      1000000,
    );
    expect(result.level).toBe(20);
    expect(result.currentHp).toBeGreaterThan(40);
    expect(result.experience).toBe(0);
  });
});
describe('formation', () => {
  it.each(['up', 'down', 'left', 'right'] as const)(
    'returns finite destinations for %s',
    (direction) => {
      const p = formationDestination({ x: 100, y: 100 }, direction, 'tank');
      expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
    },
  );
  it('recovers only beyond the limit', () => {
    expect(shouldRecoverFollower({ x: 0, y: 0 }, { x: 300, y: 0 }, 220)).toBe(true);
    expect(shouldRecoverFollower({ x: 0, y: 0 }, { x: 20, y: 0 }, 220)).toBe(false);
  });
});
describe('navigation', () => {
  const grid = {
    width: 5,
    height: 5,
    isWalkable: (x: number, y: number) => x >= 0 && y >= 0 && x < 5 && y < 5 && !(x === 2 && y < 4),
  };
  it('finds deterministic cardinal paths around obstacles', () => {
    const a = findPath(grid, { x: 0, y: 0 }, { x: 4, y: 0 });
    const b = findPath(grid, { x: 0, y: 0 }, { x: 4, y: 0 });
    expect(a).toEqual(b);
    expect(a).not.toBeNull();
    expect(
      a!.every(
        (p, i) => i === 0 || Math.abs(p.x - a![i - 1]!.x) + Math.abs(p.y - a![i - 1]!.y) === 1,
      ),
    ).toBe(true);
  });
  it('handles same, unreachable, and bounds', () => {
    expect(findPath(grid, { x: 1, y: 1 }, { x: 1, y: 1 })).toEqual([{ x: 1, y: 1 }]);
    expect(findPath(grid, { x: -1, y: 0 }, { x: 1, y: 1 })).toBeNull();
    expect(
      findPath({ width: 3, height: 3, isWalkable: (x) => x === 0 }, { x: 0, y: 0 }, { x: 2, y: 2 }),
    ).toBeNull();
  });
});
