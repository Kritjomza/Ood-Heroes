import { describe, expect, it } from 'vitest';
import { moveCardinal, safePlayerSpawn } from '../src/index';

const openGrid = {
  width: 64,
  height: 64,
  isWalkable: (x: number, y: number) => x >= 0 && y >= 0 && x < 64 && y < 64,
};

describe('shared cardinal movement', () => {
  it.each([
    ['up', { x: 100, y: 94 }],
    ['down', { x: 100, y: 106 }],
    ['left', { x: 94, y: 100 }],
    ['right', { x: 106, y: 100 }],
    ['none', { x: 100, y: 100 }],
  ] as const)('moves %s by the fixed 50 ms displacement', (direction, expected) => {
    expect(moveCardinal({ x: 100, y: 100 }, direction, 50, 120, openGrid, 0)).toEqual(expected);
  });

  it('rejects a cardinal step whose player radius would enter a blocked tile', () => {
    const grid = {
      width: 4,
      height: 4,
      isWalkable: (x: number, y: number) => !(x === 2 && y === 1),
    };
    expect(moveCardinal({ x: 57, y: 48 }, 'right', 50, 120, grid, 4)).toEqual({
      x: 57,
      y: 48,
    });
  });

  it('keeps the player radius inside world bounds', () => {
    expect(moveCardinal({ x: 15, y: 100 }, 'left', 50, 120, openGrid, 15)).toEqual({
      x: 15,
      y: 100,
    });
  });

  it('applies map-derived slow terrain without treating it as collision', () => {
    const slowGrid = {
      ...openGrid,
      terrainMultiplierAt: (x: number, y: number) => (x === 3 && y === 3 ? 0.55 : 1),
    };
    expect(moveCardinal({ x: 112, y: 112 }, 'right', 100, 100, slowGrid, 0)).toEqual({
      x: 117.5,
      y: 112,
    });
  });

  it('returns deterministic safe-zone spawns that are walkable and in bounds', () => {
    const first = safePlayerSpawn(0);
    const wrapped = safePlayerSpawn(10);
    expect(first).toEqual({ x: 1040, y: 1520 });
    expect(wrapped).toEqual(first);
    expect(Number.isFinite(first.x) && Number.isFinite(first.y)).toBe(true);
  });
});
