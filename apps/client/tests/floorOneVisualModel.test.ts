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
    expect(first.depths).toEqual({ ground: -20, path: -17, detail: -15, objects: 3, foreground: 12 });
  });

  it('defines authored zones, routes, and scale limits without covering interactive footprints', () => {
    const visual = createFloorOneVisualModel(FLOOR_ONE_MAP, 1931);
    expect(visual.paths.length).toBeGreaterThan(0);
    expect(visual.zoneStyles.map((zone) => zone.id)).toEqual(expect.arrayContaining(['central_camp', 'guardian_arena']));
    expect(visual.scale.heroMaxTiles).toBeLessThanOrEqual(3);
    expect(visual.details.every((detail) => !visual.reserved.has(`${detail.tileX},${detail.tileY}`))).toBe(true);
    expect(visual.river.some((piece) => piece.assetId === 'floor1.river.bridge')).toBe(true);
    expect(visual.transitions.map((item) => item.assetId)).toEqual(expect.arrayContaining(['floor1.transition.honey-mint', 'floor1.prop.friendly-sign']));
    expect(visual.landmarks).toHaveLength(5);
    expect(visual.placements.every((item) => item.assetId.startsWith('floor1.'))).toBe(true);
  });
});
