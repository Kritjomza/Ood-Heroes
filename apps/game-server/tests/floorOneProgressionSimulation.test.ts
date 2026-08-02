// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { FloorOneProgressionSimulation } from '../src/simulation/FloorOneProgressionSimulation';

describe('server-authoritative Floor 1 progression', () => {
  it('unlocks, runs, and defeats the shared guardian for eligible contributors', () => {
    const floor = new FloorOneProgressionSimulation();
    floor.addPlayer('a');
    floor.addPlayer('b');
    for (let index = 0; index < 20; index++) floor.recordMonsterReward('a');
    expect(floor.playerSnapshot('a')).toMatchObject({ floorProgress: 100, guardianEligible: true });
    expect(floor.startGuardian('a')).toBe(true);
    floor.damageGuardian('a', 3600);
    expect(floor.guardianSnapshot().phase).toBe('enraged');
    floor.damageGuardian('b', 1400);
    expect(floor.guardianSnapshot()).toMatchObject({ status: 'defeated', portalUnlocked: true });
    expect(floor.playerSnapshot('a').bossDefeated).toBe(true);
    expect(floor.playerSnapshot('b').bossDefeated).toBe(true);
  });

  it('requires manual portal entry and replays an idempotent completion result', () => {
    const floor = new FloorOneProgressionSimulation();
    floor.addPlayer('a');
    floor.forceEligible('a');
    floor.startGuardian('a');
    floor.damageGuardian('a', 5000);
    expect(floor.completePortal('a', 'request-1', false).status).toBe('manual-entry-required');
    const first = floor.completePortal('a', 'request-1', true);
    const duplicate = floor.completePortal('a', 'request-1', true);
    expect(first).toMatchObject({ status: 'completed', gold: 500, gem: 100 });
    expect(duplicate).toEqual(first);
  });
});
