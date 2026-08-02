import { describe, expect, it } from 'vitest';
import {
  advanceFloorGuardian,
  createFloorGuardian,
  damageFloorGuardian,
  startFloorGuardian,
} from '../src/index';

describe('Angry Refrigerator state machine', () => {
  it('cannot start before progress eligibility and enters active combat at 100 percent', () => {
    expect(startFloorGuardian(createFloorGuardian(), 99).state.status).toBe('locked');
    const started = startFloorGuardian(createFloorGuardian(), 100);
    expect(started.state).toMatchObject({ status: 'active', currentHp: 5000, phase: 'normal' });
  });

  it('emits frontal, cold-wind, and add events on bounded deterministic schedules', () => {
    let state = startFloorGuardian(createFloorGuardian(), 100).state;
    const first = advanceFloorGuardian(state, 60);
    state = first.state;
    expect(first.events.map((event) => event.type)).toEqual(expect.arrayContaining(['frontal-attack', 'cold-wind', 'summon-adds']));
    expect(state.activeAdds).toBe(2);
  });

  it('enrages below 30 percent and records eligible contributors on defeat', () => {
    let state = startFloorGuardian(createFloorGuardian(), 100).state;
    state = damageFloorGuardian(state, 'player-a', 3600).state;
    expect(state.phase).toBe('enraged');
    state = damageFloorGuardian(state, 'player-b', 1350).state;
    const defeated = damageFloorGuardian(state, 'player-a', 100).state;
    expect(defeated.status).toBe('defeated');
    expect(defeated.eligiblePlayerIds).toEqual(['player-a', 'player-b']);
  });

  it('resets an abandoned encounter without granting eligibility', () => {
    const active = startFloorGuardian(createFloorGuardian(), 100).state;
    const reset = advanceFloorGuardian({ ...active, participantDamage: {} }, 601);
    expect(reset.state.status).toBe('available');
    expect(reset.state.eligiblePlayerIds).toEqual([]);
  });
});
