import { describe, expect, it } from 'vitest';
import { FLOOR_ONE_MAP } from '@odd-tower/game-core';
import { createFloorOneVisualModel } from '../src/game/map/floorOneVisualModel';

describe('Floor 1 visual model', () => {
  it('creates deterministic layered details outside collision tiles', () => {
    const first = createFloorOneVisualModel(FLOOR_ONE_MAP, 1931);
    const second = createFloorOneVisualModel(FLOOR_ONE_MAP, 1931);
    expect(first).toEqual(second);
    expect(first.details.length).toBeGreaterThan(80);
    expect(first.details.every((detail) => !first.blocked.has(`${detail.tileX},${detail.tileY}`))).toBe(true);
    expect(first.depths).toEqual({ ground: -20, detail: -15, objects: 3, foreground: 12 });
  });
});
