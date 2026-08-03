import { describe, expect, it } from 'vitest';
import { FLOOR_ONE_ASSETS, validateFloorOneAssets } from '../src/game/map/floorOneAssetRegistry';

describe('Floor 1 asset registry', () => {
  it('has stable unique IDs and paths with complete replacement metadata', () => {
    expect(validateFloorOneAssets(FLOOR_ONE_ASSETS)).toEqual([]);
    expect(FLOOR_ONE_ASSETS.length).toBeGreaterThanOrEqual(20);
    expect(FLOOR_ONE_ASSETS.every((asset) => asset.path.startsWith('/assets/game/floor-01/'))).toBe(true);
  });
});
