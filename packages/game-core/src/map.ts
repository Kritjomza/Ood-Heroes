import { WORLD } from './config';
import type { GridPoint, Vector2 } from './types';
const blocked = new Set<string>();
for (let i = 0; i < 64; i++) {
  blocked.add(`${i},0`);
  blocked.add(`${i},63`);
  blocked.add(`0,${i}`);
  blocked.add(`63,${i}`);
}
for (let y = 8; y < 25; y++) if (y !== 17) blocked.add(`18,${y}`);
for (let x = 38; x < 55; x++) if (x !== 46) blocked.add(`${x},40`);
for (let y = 42; y < 58; y++) if (y !== 52) blocked.add(`45,${y}`);
export const prototypeMap = {
  width: 64,
  height: 64,
  isWalkable: (x: number, y: number) =>
    Number.isInteger(x) &&
    Number.isInteger(y) &&
    x >= 0 &&
    y >= 0 &&
    x < 64 &&
    y < 64 &&
    !blocked.has(`${x},${y}`),
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
  Math.hypot(p.x - WORLD.safeCenter.x, p.y - WORLD.safeCenter.y) <= WORLD.safeRadius;
export const MONSTER_SPAWNS: Vector2[] = [
  { x: 700, y: 980 },
  { x: 640, y: 1100 },
  { x: 790, y: 1210 },
  { x: 1240, y: 800 },
  { x: 1380, y: 720 },
  { x: 1510, y: 920 },
  { x: 420, y: 420 },
  { x: 560, y: 480 },
  { x: 1640, y: 1420 },
  { x: 1500, y: 1600 },
  { x: 380, y: 1480 },
  { x: 560, y: 1640 },
  { x: 1280, y: 1240 },
  { x: 1440, y: 1160 },
  { x: 1720, y: 560 },
  { x: 980, y: 480 },
  { x: 960, y: 1540 },
  { x: 1160, y: 1720 },
];
