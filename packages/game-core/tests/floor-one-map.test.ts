import { describe, expect, it } from 'vitest';
import {
  FLOOR_ONE_MAP,
  REQUIRED_FLOOR_ONE_LAYERS,
  createNavigationGrid,
  floorOneObject,
  isZoneReachable,
  terrainMultiplierAt,
  validateFloorOneMap,
} from '../src/index';

describe('Floor 1 typed map contract', () => {
  it('validates the exact world dimensions and required Tiled-compatible layers', () => {
    expect(FLOOR_ONE_MAP).toMatchObject({ width: 64, height: 64, tileWidth: 32, tileHeight: 32 });
    expect(FLOOR_ONE_MAP.layers.map((layer) => layer.name)).toEqual(REQUIRED_FLOOR_ONE_LAYERS);
    expect(validateFloorOneMap(FLOOR_ONE_MAP)).toEqual([]);
  });

  it('keeps spawns out of the Safe Zone and gives the camp three exits', () => {
    const safeZone = floorOneObject('zone.central_camp');
    const spawns = FLOOR_ONE_MAP.objects.filter((object) => object.type === 'monster_spawn');
    expect(safeZone).toMatchObject({ zone: 'central_camp', safeZone: true });
    expect(spawns.length).toBeGreaterThanOrEqual(5);
    expect(spawns.every((spawn) => spawn.zone !== 'central_camp')).toBe(true);
    expect(FLOOR_ONE_MAP.objects.filter((object) => object.type === 'camp_exit')).toHaveLength(3);
  });

  it('derives collision and weighted slow terrain from map layers', () => {
    const grid = createNavigationGrid(FLOOR_ONE_MAP);
    expect(grid.isWalkable(0, 0)).toBe(false);
    expect(grid.isWalkable(32, 47)).toBe(true);
    expect(grid.costAt(9, 25)).toBe(2);
    expect(grid.costAt(32, 47)).toBe(1);
    expect(terrainMultiplierAt({ x: 9 * 32 + 16, y: 25 * 32 + 16 })).toBe(0.55);
  });

  it('connects every required gameplay zone while keeping the sealed portal excluded', () => {
    expect(isZoneReachable('central_camp', 'beginner_fields')).toBe(true);
    expect(isZoneReachable('central_camp', 'spicy_forest')).toBe(true);
    expect(isZoneReachable('central_camp', 'chocolate_swamp')).toBe(true);
    expect(isZoneReachable('central_camp', 'guardian_arena')).toBe(true);
    expect(createNavigationGrid(FLOOR_ONE_MAP, { excludePortal: true }).isWalkable(32, 4)).toBe(false);
  });

  it('rejects duplicate object IDs and malformed dimensions', () => {
    const malformed = {
      ...FLOOR_ONE_MAP,
      width: 63,
      objects: [...FLOOR_ONE_MAP.objects, FLOOR_ONE_MAP.objects[0]!],
    };
    expect(validateFloorOneMap(malformed)).toEqual(
      expect.arrayContaining(['Floor 1 must be 64x64 tiles', 'Duplicate object id: zone.portal']),
    );
  });
});
