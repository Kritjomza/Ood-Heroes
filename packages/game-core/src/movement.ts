import { WORLD } from './config.js';
import { prototypeMap } from './map.js';
import type { Grid, Vector2 } from './types.js';

export type CardinalDirection = 'up' | 'down' | 'left' | 'right' | 'none';

const directionVector: Record<CardinalDirection, Vector2> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
  none: { x: 0, y: 0 },
};

function occupiesWalkableTiles(position: Vector2, radius: number, grid: Grid) {
  const worldWidth = grid.width * WORLD.tileSize;
  const worldHeight = grid.height * WORLD.tileSize;
  if (
    position.x - radius < 0 ||
    position.y - radius < 0 ||
    position.x + radius > worldWidth ||
    position.y + radius > worldHeight
  )
    return false;

  const inset = Math.max(0, radius - 0.001);
  for (const point of [
    { x: position.x - inset, y: position.y - inset },
    { x: position.x + inset, y: position.y - inset },
    { x: position.x - inset, y: position.y + inset },
    { x: position.x + inset, y: position.y + inset },
  ]) {
    const tileX = Math.floor(point.x / WORLD.tileSize);
    const tileY = Math.floor(point.y / WORLD.tileSize);
    if (!grid.isWalkable(tileX, tileY)) return false;
  }
  return true;
}

export function moveCardinal(
  position: Vector2,
  direction: CardinalDirection,
  durationMs: number,
  speed: number,
  grid: Grid = prototypeMap,
  radius = 15,
): Vector2 {
  if (!Number.isFinite(durationMs) || durationMs <= 0 || !Number.isFinite(speed) || speed < 0)
    return { ...position };
  const vector = directionVector[direction];
  const distance = speed * (durationMs / 1000);
  const candidate = {
    x: position.x + vector.x * distance,
    y: position.y + vector.y * distance,
  };
  return occupiesWalkableTiles(candidate, radius, grid) ? candidate : { ...position };
}

const SPAWN_OFFSETS: readonly Vector2[] = [
  { x: 0, y: 0 },
  { x: -64, y: 0 },
  { x: 64, y: 0 },
  { x: 0, y: -64 },
  { x: 0, y: 64 },
  { x: -64, y: -64 },
  { x: 64, y: -64 },
  { x: -64, y: 64 },
  { x: 64, y: 64 },
  { x: 96, y: 0 },
] as const;

export function safePlayerSpawn(index: number): Vector2 {
  const offset =
    SPAWN_OFFSETS[((index % SPAWN_OFFSETS.length) + SPAWN_OFFSETS.length) % SPAWN_OFFSETS.length]!;
  return { x: WORLD.safeCenter.x + offset.x, y: WORLD.safeCenter.y + offset.y };
}
