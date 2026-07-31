import {
  findPath,
  isInSafeZone,
  prototypeMap,
  tileToWorld,
  worldToTile,
  type SeededRandom,
  type Vector2,
} from '@odd-tower/game-core';

export function findMonsterPath(
  start: Vector2,
  goal: Vector2,
  spawn: Vector2,
  leashRadius: number,
): Vector2[] | null {
  const constrainedGrid = {
    width: prototypeMap.width,
    height: prototypeMap.height,
    isWalkable(x: number, y: number) {
      if (!prototypeMap.isWalkable(x, y)) return false;
      const point = tileToWorld({ x, y });
      return (
        !isInSafeZone(point) && Math.hypot(point.x - spawn.x, point.y - spawn.y) <= leashRadius
      );
    },
  };
  const path = findPath(constrainedGrid, worldToTile(start), worldToTile(goal));
  return path?.map(tileToWorld) ?? null;
}

export class StuckTracker {
  private lastProgressPosition: Vector2 | null = null;
  private lastProgressTick = 0;

  constructor(
    private readonly progressThreshold: number,
    private readonly stuckDurationTicks: number,
  ) {}

  observe(position: Vector2, tick: number, hasGoal: boolean) {
    if (!hasGoal) {
      this.reset(position, tick);
      return false;
    }
    if (!this.lastProgressPosition) {
      this.reset(position, tick);
      return false;
    }
    if (
      Math.hypot(
        position.x - this.lastProgressPosition.x,
        position.y - this.lastProgressPosition.y,
      ) >= this.progressThreshold
    ) {
      this.reset(position, tick);
      return false;
    }
    return tick - this.lastProgressTick >= this.stuckDurationTicks;
  }

  reset(position: Vector2, tick: number) {
    this.lastProgressPosition = { ...position };
    this.lastProgressTick = tick;
  }
}

export function chooseWanderDestination(
  spawn: Vector2,
  random: Pick<SeededRandom, 'next'>,
  radius: number,
): Vector2 | null {
  const origin = worldToTile(spawn);
  const tileRadius = Math.ceil(radius / 32);
  const candidates: Vector2[] = [];
  for (let y = origin.y - tileRadius; y <= origin.y + tileRadius; y++)
    for (let x = origin.x - tileRadius; x <= origin.x + tileRadius; x++) {
      if (!prototypeMap.isWalkable(x, y)) continue;
      const point = tileToWorld({ x, y });
      const separation = Math.hypot(point.x - spawn.x, point.y - spawn.y);
      if (separation > 0 && separation <= radius && !isInSafeZone(point)) candidates.push(point);
    }
  if (!candidates.length) return null;
  return candidates[
    Math.min(candidates.length - 1, Math.floor(random.next() * candidates.length))
  ]!;
}
