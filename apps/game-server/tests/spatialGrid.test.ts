// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { SpatialGrid } from '../src/simulation/SpatialGrid';

type Item = { id: string; x: number; y: number };

describe('SpatialGrid', () => {
  it('queries the same and neighboring cells in distance then stable-ID order', () => {
    const grid = new SpatialGrid<Item>(160);
    grid.upsert({ id: 'b', x: 159, y: 80 });
    grid.upsert({ id: 'a', x: 161, y: 80 });
    grid.upsert({ id: 'far', x: 500, y: 500 });
    expect(grid.queryRadius({ x: 160, y: 80 }, 4).map((item) => item.id)).toEqual(['a', 'b']);
  });

  it('moves membership without duplicates and removes entities cleanly', () => {
    const grid = new SpatialGrid<Item>(160);
    const item = { id: 'm', x: 10, y: 10 };
    grid.upsert(item);
    item.x = 330;
    grid.upsert(item);
    expect(grid.queryRadius({ x: 10, y: 10 }, 20)).toEqual([]);
    expect(grid.queryRadius({ x: 330, y: 10 }, 20).map((value) => value.id)).toEqual(['m']);
    expect(grid.size).toBe(1);
    expect(grid.remove('m')).toBe(true);
    expect(grid.size).toBe(0);
  });

  it('clears all buckets for room disposal', () => {
    const grid = new SpatialGrid<Item>(160);
    grid.upsert({ id: 'a', x: 0, y: 0 });
    grid.upsert({ id: 'b', x: 320, y: 320 });
    grid.clear();
    expect(grid.size).toBe(0);
    expect(grid.bucketCount).toBe(0);
  });
});
