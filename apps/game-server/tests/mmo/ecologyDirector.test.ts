import { describe, expect, it } from 'vitest';
import { EcologyDirector, type HabitatProfile } from '../../src/mmo/ecology/EcologyDirector.js';

const habitat: HabitatProfile = {
  id: 'floor-1',
  spawnPoints: [{ x: 10, y: 10 }, { x: 30, y: 10 }, { x: 50, y: 10 }, { x: 70, y: 10 }],
  targetPopulation: 3,
  maxPopulation: 6,
  respawnDelayTicks: 2,
  monsterKinds: ['radish', 'pudding'],
};

describe('MMO ecology director', () => {
  it('is deterministic for the same seed and bounded by habitat capacity', () => {
    const left = new EcologyDirector(habitat, { seed: 77 });
    const right = new EcologyDirector(habitat, { seed: 77 });
    expect(left.tickZone()).toEqual(right.tickZone());
    expect(left.snapshot().filter((monster) => monster.status === 'alive')).toHaveLength(3);
    expect(left.snapshot().filter((monster) => monster.status === 'alive').length).toBeLessThanOrEqual(6);
  });

  it('respawns standard monsters after the configured delay', () => {
    const ecology = new EcologyDirector(habitat, { seed: 2 });
    const first = ecology.tickZone().find((monster) => !monster.boss)!;
    expect(ecology.defeat(first.id)).toBe(true);
    expect(ecology.snapshot().find((monster) => monster.id === first.id)!.status).toBe('defeated');
    ecology.tickZone();
    expect(ecology.snapshot().find((monster) => monster.id === first.id)!.status).toBe('defeated');
    ecology.tickZone();
    const respawned = ecology.snapshot().find((monster) => monster.id === first.id)!;
    expect(respawned.status).toBe('alive');
    expect(respawned.spawnGeneration).toBe(1);
  });

  it('spawns one activity-triggered boss and supports scheduled bosses per director', () => {
    const left = new EcologyDirector(habitat, { seed: 5, dynamicBossActivity: 2, dynamicBossCooldownTicks: 10 });
    const right = new EcologyDirector(habitat, { seed: 5, dynamicBossActivity: 2, dynamicBossCooldownTicks: 10 });
    left.tickZone();
    right.tickZone();
    left.recordActivity(3);
    right.recordActivity(3);
    expect(left.tickZone().filter((monster) => monster.boss)).toHaveLength(1);
    expect(left.spawnScheduledBoss('world-event')).toBeNull();
    expect(right.tickZone().filter((monster) => monster.boss)).toHaveLength(1);
  });
});
