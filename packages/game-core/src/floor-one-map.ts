import type { Grid, GridPoint, Vector2 } from './types.js';

export const REQUIRED_FLOOR_ONE_LAYERS = [
  'Ground_Base',
  'Ground_Detail',
  'Terrain_Slow',
  'Decor_Below',
  'Collision',
  'Gameplay_Objects',
  'Monster_Spawns',
  'Boss_Objects',
  'Portal_Objects',
  'Decor_Above',
  'Occlusion',
  'Debug',
] as const;

export type FloorOneLayerName = (typeof REQUIRED_FLOOR_ONE_LAYERS)[number];
export type FloorOneZone =
  | 'portal'
  | 'guardian_arena'
  | 'chocolate_swamp'
  | 'spicy_forest'
  | 'beginner_fields'
  | 'central_camp';

export type TileRect = { x: number; y: number; width: number; height: number };
export type FloorOneLayer = {
  name: FloorOneLayerName;
  type: 'tilelayer' | 'objectgroup';
  rects?: readonly TileRect[];
};
export type FloorOneObject = TileRect & {
  id: string;
  type:
    | 'zone'
    | 'player_spawn'
    | 'monster_spawn'
    | 'camp_exit'
    | 'landmark'
    | 'boss_spawn'
    | 'add_spawn'
    | 'player_entry'
    | 'reset_boundary'
    | 'combat_boundary'
    | 'portal';
  zone: FloorOneZone;
  levelMin?: number;
  levelMax?: number;
  spawnGroup?: string;
  spawnWeight?: number;
  respawnSeconds?: number;
  radius?: number;
  slowMultiplier?: number;
  bossId?: string;
  portalId?: string;
  requiresBossClear?: boolean;
  safeZone?: boolean;
  healPerSecond?: number;
  targetable?: boolean;
  collisionGroup?: string;
  pathCost?: number;
};
export type FloorOneMapDefinition = {
  id: 'floor_1';
  name: string;
  width: number;
  height: number;
  tileWidth: number;
  tileHeight: number;
  layers: readonly FloorOneLayer[];
  objects: readonly FloorOneObject[];
};

const collisionRects: readonly TileRect[] = [
  { x: 0, y: 0, width: 64, height: 1 },
  { x: 0, y: 63, width: 64, height: 1 },
  { x: 0, y: 0, width: 1, height: 64 },
  { x: 63, y: 0, width: 1, height: 64 },
  { x: 2, y: 18, width: 8, height: 2 },
  { x: 17, y: 22, width: 2, height: 9 },
  { x: 42, y: 18, width: 2, height: 8 },
  { x: 52, y: 30, width: 8, height: 2 },
  { x: 4, y: 38, width: 9, height: 2 },
  { x: 48, y: 42, width: 2, height: 9 },
  { x: 22, y: 56, width: 20, height: 2 },
];

const slowRects: readonly TileRect[] = [
  { x: 5, y: 21, width: 11, height: 14 },
  { x: 16, y: 27, width: 5, height: 6 },
];

const layers: readonly FloorOneLayer[] = REQUIRED_FLOOR_ONE_LAYERS.map((name) => ({
  name,
  type: name.includes('Objects') || name.includes('Spawns') ? 'objectgroup' : 'tilelayer',
  ...(name === 'Collision' ? { rects: collisionRects } : {}),
  ...(name === 'Terrain_Slow' ? { rects: slowRects } : {}),
})) as readonly FloorOneLayer[];

const zone = (id: string, zoneName: FloorOneZone, rect: TileRect, extra: Partial<FloorOneObject> = {}) =>
  ({ id, type: 'zone', zone: zoneName, ...rect, ...extra }) as FloorOneObject;
const point = (
  id: string,
  type: FloorOneObject['type'],
  zoneName: FloorOneZone,
  x: number,
  y: number,
  extra: Partial<FloorOneObject> = {},
) => ({ id, type, zone: zoneName, x, y, width: 1, height: 1, ...extra }) as FloorOneObject;

export const FLOOR_ONE_MAP: FloorOneMapDefinition = {
  id: 'floor_1',
  name: 'สวนครัวหลุดโลก',
  width: 64,
  height: 64,
  tileWidth: 32,
  tileHeight: 32,
  layers,
  objects: [
    zone('zone.portal', 'portal', { x: 27, y: 1, width: 11, height: 7 }),
    zone('zone.guardian_arena', 'guardian_arena', { x: 20, y: 8, width: 25, height: 13 }),
    zone('zone.chocolate_swamp', 'chocolate_swamp', { x: 2, y: 16, width: 21, height: 22 }, { slowMultiplier: 0.55, pathCost: 2 }),
    zone('zone.spicy_forest', 'spicy_forest', { x: 39, y: 17, width: 23, height: 22 }),
    zone('zone.beginner_fields', 'beginner_fields', { x: 2, y: 36, width: 23, height: 24 }),
    zone('zone.central_camp', 'central_camp', { x: 25, y: 40, width: 15, height: 15 }, { safeZone: true, healPerSecond: 0.1 }),
    point('spawn.player.1', 'player_spawn', 'central_camp', 32, 47),
    point('spawn.player.2', 'player_spawn', 'central_camp', 29, 48),
    point('spawn.player.3', 'player_spawn', 'central_camp', 35, 48),
    point('camp.exit.west', 'camp_exit', 'central_camp', 25, 47),
    point('camp.exit.east', 'camp_exit', 'central_camp', 39, 47),
    point('camp.exit.north', 'camp_exit', 'central_camp', 32, 40),
    point('landmark.summon_shrine', 'landmark', 'central_camp', 29, 45),
    point('landmark.team_station', 'landmark', 'central_camp', 35, 45),
    point('landmark.afk_chest', 'landmark', 'central_camp', 32, 51),
    point('spawn.radish', 'monster_spawn', 'beginner_fields', 13, 45, { levelMin: 1, levelMax: 3, spawnGroup: 'vegetable', spawnWeight: 4, respawnSeconds: 5 }),
    point('spawn.sauce_bag', 'monster_spawn', 'beginner_fields', 19, 50, { levelMin: 2, levelMax: 3, spawnGroup: 'vegetable', spawnWeight: 3, respawnSeconds: 5 }),
    point('spawn.dust_ball', 'monster_spawn', 'spicy_forest', 48, 30, { levelMin: 3, levelMax: 6, spawnGroup: 'spicy', spawnWeight: 3, respawnSeconds: 6 }),
    point('spawn.sausage', 'monster_spawn', 'spicy_forest', 56, 24, { levelMin: 4, levelMax: 6, spawnGroup: 'spicy', spawnWeight: 2, respawnSeconds: 7 }),
    point('spawn.pudding', 'monster_spawn', 'chocolate_swamp', 10, 27, { levelMin: 5, levelMax: 8, spawnGroup: 'swamp', spawnWeight: 2, respawnSeconds: 8 }),
    point('boss.angry_refrigerator', 'boss_spawn', 'guardian_arena', 32, 13, { bossId: 'angry_refrigerator', targetable: true }),
    point('boss.add.west', 'add_spawn', 'guardian_arena', 25, 13, { bossId: 'angry_refrigerator' }),
    point('boss.add.east', 'add_spawn', 'guardian_arena', 39, 13, { bossId: 'angry_refrigerator' }),
    point('arena.player_entry', 'player_entry', 'guardian_arena', 32, 20),
    { id: 'arena.reset', type: 'reset_boundary', zone: 'guardian_arena', x: 18, y: 7, width: 29, height: 16, bossId: 'angry_refrigerator' },
    { id: 'arena.combat', type: 'combat_boundary', zone: 'guardian_arena', x: 20, y: 8, width: 25, height: 13, bossId: 'angry_refrigerator' },
    { id: 'portal.floor_2', type: 'portal', zone: 'portal', x: 29, y: 2, width: 7, height: 5, portalId: 'floor_2', requiresBossClear: true, targetable: false },
  ],
};

const contains = (rect: TileRect, x: number, y: number) =>
  x >= rect.x && y >= rect.y && x < rect.x + rect.width && y < rect.y + rect.height;

export function validateFloorOneMap(map: FloorOneMapDefinition): string[] {
  const errors: string[] = [];
  if (map.width !== 64 || map.height !== 64) errors.push('Floor 1 must be 64x64 tiles');
  if (map.tileWidth !== 32 || map.tileHeight !== 32) errors.push('Floor 1 tiles must be 32x32 pixels');
  for (const name of REQUIRED_FLOOR_ONE_LAYERS)
    if (!map.layers.some((layer) => layer.name === name)) errors.push(`Missing layer: ${name}`);
  const ids = new Set<string>();
  for (const object of map.objects) {
    if (ids.has(object.id)) errors.push(`Duplicate object id: ${object.id}`);
    ids.add(object.id);
  }
  const safe = map.objects.find((object) => object.id === 'zone.central_camp');
  if (!safe?.safeZone) errors.push('Central camp must be a Safe Zone');
  if (safe && map.objects.some((object) => object.type === 'monster_spawn' && contains(safe, object.x, object.y)))
    errors.push('Monster spawn inside Safe Zone');
  if (map.objects.filter((object) => object.type === 'camp_exit').length < 3)
    errors.push('Central camp needs at least three exits');
  if (!map.objects.some((object) => object.type === 'boss_spawn')) errors.push('Missing boss spawn');
  if (!map.objects.some((object) => object.type === 'portal' && object.requiresBossClear))
    errors.push('Missing sealed portal');
  return errors;
}

export type NavigationGrid = Grid & {
  costAt: (x: number, y: number) => number;
  terrainMultiplierAt: (x: number, y: number) => number;
};
export function createNavigationGrid(
  map: FloorOneMapDefinition,
  options: { excludePortal?: boolean; excludeLockedArena?: boolean } = {},
): NavigationGrid {
  const blocked = map.layers.find((layer) => layer.name === 'Collision')?.rects ?? [];
  const slow = map.layers.find((layer) => layer.name === 'Terrain_Slow')?.rects ?? [];
  const portal = map.objects.find((object) => object.type === 'portal');
  const arena = map.objects.find((object) => object.type === 'combat_boundary');
  return {
    width: map.width,
    height: map.height,
    isWalkable: (x, y) =>
      Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < map.width && y < map.height &&
      !blocked.some((rect) => contains(rect, x, y)) &&
      !(options.excludePortal && portal && contains(portal, x, y)) &&
      !(options.excludeLockedArena && arena && contains(arena, x, y)),
    costAt: (x, y) => (slow.some((rect) => contains(rect, x, y)) ? 2 : 1),
    terrainMultiplierAt: (x, y) => (slow.some((rect) => contains(rect, x, y)) ? 0.55 : 1),
  };
}

export function floorOneObject(id: string): FloorOneObject | undefined {
  return FLOOR_ONE_MAP.objects.find((object) => object.id === id);
}

export function terrainMultiplierAt(point: Vector2): number {
  const x = Math.floor(point.x / FLOOR_ONE_MAP.tileWidth);
  const y = Math.floor(point.y / FLOOR_ONE_MAP.tileHeight);
  const slow = FLOOR_ONE_MAP.layers.find((layer) => layer.name === 'Terrain_Slow')?.rects ?? [];
  return slow.some((rect) => contains(rect, x, y)) ? 0.55 : 1;
}

const zoneCenter = (name: FloorOneZone): GridPoint | undefined => {
  const object = FLOOR_ONE_MAP.objects.find((item) => item.type === 'zone' && item.zone === name);
  return object ? { x: Math.floor(object.x + object.width / 2), y: Math.floor(object.y + object.height / 2) } : undefined;
};

export function isZoneReachable(from: FloorOneZone, to: FloorOneZone): boolean {
  const start = zoneCenter(from);
  const goal = zoneCenter(to);
  if (!start || !goal) return false;
  const grid = createNavigationGrid(FLOOR_ONE_MAP);
  const queue = [start];
  const seen = new Set([`${start.x},${start.y}`]);
  while (queue.length) {
    const current = queue.shift()!;
    if (current.x === goal.x && current.y === goal.y) return true;
    for (const next of [
      { x: current.x, y: current.y - 1 },
      { x: current.x - 1, y: current.y },
      { x: current.x + 1, y: current.y },
      { x: current.x, y: current.y + 1 },
    ]) {
      const key = `${next.x},${next.y}`;
      if (!seen.has(key) && grid.isWalkable(next.x, next.y)) {
        seen.add(key);
        queue.push(next);
      }
    }
  }
  return false;
}
