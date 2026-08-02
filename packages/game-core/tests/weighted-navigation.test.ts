import { describe, expect, it } from 'vitest';
import { FLOOR_ONE_MAP, createNavigationGrid, findPath } from '../src/index';

describe('weighted Floor 1 navigation', () => {
  it('prefers a longer dry route over expensive slow terrain', () => {
    const grid = {
      width: 5,
      height: 3,
      isWalkable: (x: number, y: number) => x >= 0 && y >= 0 && x < 5 && y < 3,
      costAt: (x: number, y: number) => (y === 1 && x > 0 && x < 4 ? 5 : 1),
    };
    const path = findPath(grid, { x: 0, y: 1 }, { x: 4, y: 1 });
    expect(path).toEqual([
      { x: 0, y: 1 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 1 },
    ]);
  });

  it('never returns a sealed portal tile to Auto Hunt', () => {
    const grid = createNavigationGrid(FLOOR_ONE_MAP, { excludePortal: true });
    expect(findPath(grid, { x: 32, y: 20 }, { x: 32, y: 4 })).toBeNull();
  });
});
