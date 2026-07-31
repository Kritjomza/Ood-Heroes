// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { SeededRandom, isInSafeZone, prototypeMap, worldToTile } from '@odd-tower/game-core';
import {
  StuckTracker,
  chooseWanderDestination,
  findMonsterPath,
} from '../src/simulation/MonsterNavigator';

describe('monster A* fallback', () => {
  it('routes around a wall with cardinal steps while respecting leash and Safe Zone', () => {
    const spawn = { x: 528, y: 528 };
    const goal = { x: 656, y: 528 };
    const path = findMonsterPath(spawn, goal, spawn, 500);
    expect(path).not.toBeNull();
    expect(path!.every((point) => !isInSafeZone(point))).toBe(true);
    expect(path!.every((point) => Math.hypot(point.x - spawn.x, point.y - spawn.y) <= 500)).toBe(
      true,
    );
    for (let index = 1; index < path!.length; index++) {
      const a = worldToTile(path![index - 1]!);
      const b = worldToTile(path![index]!);
      expect(Math.abs(a.x - b.x) + Math.abs(a.y - b.y)).toBe(1);
    }
  });

  it('fails safely when the leash cannot reach the goal', () => {
    const spawn = { x: 528, y: 528 };
    expect(findMonsterPath(spawn, { x: 900, y: 528 }, spawn, 64)).toBeNull();
  });
});

describe('monster stuck detection and wander', () => {
  it('triggers only after sustained no-progress and resets after progress', () => {
    const tracker = new StuckTracker(4, 12);
    expect(tracker.observe({ x: 100, y: 100 }, 0, true)).toBe(false);
    expect(tracker.observe({ x: 102, y: 100 }, 11, true)).toBe(false);
    expect(tracker.observe({ x: 102, y: 100 }, 12, true)).toBe(true);
    expect(tracker.observe({ x: 110, y: 100 }, 13, true)).toBe(false);
    expect(tracker.observe({ x: 110, y: 100 }, 30, false)).toBe(false);
  });

  it('selects a repeatable walkable wander point within radius and outside Safe Zone', () => {
    const spawn = { x: 400, y: 400 };
    const first = chooseWanderDestination(spawn, new SeededRandom(9), 96);
    const second = chooseWanderDestination(spawn, new SeededRandom(9), 96);
    expect(first).toEqual(second);
    expect(first).not.toBeNull();
    expect(Math.hypot(first!.x - spawn.x, first!.y - spawn.y)).toBeLessThanOrEqual(96);
    const tile = worldToTile(first!);
    expect(prototypeMap.isWalkable(tile.x, tile.y)).toBe(true);
    expect(isInSafeZone(first!)).toBe(false);
  });
});
