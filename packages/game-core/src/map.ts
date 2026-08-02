import { WORLD } from './config.js';
import { FLOOR_ONE_MAP, createNavigationGrid, floorOneObject } from './floor-one-map.js';
import type { GridPoint, Vector2 } from './types.js';
const navigationGrid = createNavigationGrid(FLOOR_ONE_MAP);
const blocked = new Set<string>();
for (let y = 0; y < FLOOR_ONE_MAP.height; y++)
  for (let x = 0; x < FLOOR_ONE_MAP.width; x++)
    if (!navigationGrid.isWalkable(x, y)) blocked.add(`${x},${y}`);
export const prototypeMap = {
  width: FLOOR_ONE_MAP.width,
  height: FLOOR_ONE_MAP.height,
  isWalkable: navigationGrid.isWalkable,
  costAt: navigationGrid.costAt,
  terrainMultiplierAt: navigationGrid.terrainMultiplierAt,
  blocked,
};
export const worldToTile = (p: Vector2): GridPoint => ({
  x: Math.max(0, Math.min(63, Math.floor(p.x / WORLD.tileSize))),
  y: Math.max(0, Math.min(63, Math.floor(p.y / WORLD.tileSize))),
});
export const tileToWorld = (p: GridPoint): Vector2 => ({
  x: p.x * WORLD.tileSize + 16,
  y: p.y * WORLD.tileSize + 16,
});
export const isInSafeZone = (p: Vector2) =>
  (() => {
    const safe = floorOneObject('zone.central_camp')!;
    const tileX = p.x / WORLD.tileSize;
    const tileY = p.y / WORLD.tileSize;
    return tileX >= safe.x && tileY >= safe.y && tileX < safe.x + safe.width && tileY < safe.y + safe.height;
  })();
export const MONSTER_SPAWNS: Vector2[] = FLOOR_ONE_MAP.objects
  .filter((object) => object.type === 'monster_spawn')
  .flatMap((object) => [
    tileToWorld(object),
    tileToWorld({ x: object.x + 1, y: object.y }),
    tileToWorld({ x: object.x, y: object.y + 1 }),
    tileToWorld({ x: object.x - 1, y: object.y }),
  ]);
