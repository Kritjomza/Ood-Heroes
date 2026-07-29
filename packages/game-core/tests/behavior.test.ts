import { describe, expect, it } from 'vitest';
import {
  chooseAutoHuntTarget,
  nextAutoHuntState,
  nextMonsterMode,
  canMonsterAttack,
  monsterRespawnReady,
  awardDefeatOnce,
} from '../src/index';
describe('auto hunt', () => {
  const monsters = [
    { id: 'far', distance: 8, alive: true, reachable: true, inSafeZone: false },
    { id: 'near', distance: 2, alive: true, reachable: true, inSafeZone: false },
    { id: 'dead', distance: 1, alive: false, reachable: true, inSafeZone: false },
  ];
  it('selects nearest valid reachable target', () =>
    expect(chooseAutoHuntTarget(monsters)?.id).toBe('near'));
  it('handles safety transitions', () => {
    expect(
      nextAutoHuntState({
        enabled: true,
        hpRatio: 0.2,
        allDefeated: false,
        manualInput: false,
        paused: false,
        hasTarget: true,
        inSafeZone: false,
      }),
    ).toBe('retreating');
    expect(
      nextAutoHuntState({
        enabled: true,
        hpRatio: 0.9,
        allDefeated: false,
        manualInput: false,
        paused: false,
        hasTarget: false,
        inSafeZone: true,
        current: 'recovering',
      }),
    ).toBe('acquiring-target');
    expect(
      nextAutoHuntState({
        enabled: true,
        hpRatio: 1,
        allDefeated: false,
        manualInput: false,
        paused: false,
        hasTarget: false,
        inSafeZone: false,
        current: 'acquiring-target',
      }),
    ).toBe('waiting');
    expect(
      nextAutoHuntState({
        enabled: true,
        hpRatio: 1,
        allDefeated: true,
        manualInput: false,
        paused: false,
        hasTarget: true,
        inSafeZone: false,
      }),
    ).toBe('disabled');
    expect(
      nextAutoHuntState({
        enabled: true,
        hpRatio: 1,
        allDefeated: false,
        manualInput: true,
        paused: false,
        hasTarget: true,
        inSafeZone: false,
      }),
    ).toBe('disabled');
  });
});
describe('monster ai', () => {
  it('aggros, leashes, rejects safe zone, and avoids defeated heroes', () => {
    expect(
      nextMonsterMode({
        distanceToHero: 100,
        distanceFromSpawn: 0,
        heroInSafeZone: false,
        heroAlive: true,
        aggroRadius: 140,
        leashRadius: 260,
      }),
    ).toBe('chase');
    expect(
      nextMonsterMode({
        distanceToHero: 400,
        distanceFromSpawn: 0,
        heroInSafeZone: false,
        heroAlive: true,
        aggroRadius: 140,
        leashRadius: 260,
      }),
    ).toBe('idle');
    expect(
      nextMonsterMode({
        distanceToHero: 10,
        distanceFromSpawn: 300,
        heroInSafeZone: false,
        heroAlive: true,
        aggroRadius: 140,
        leashRadius: 260,
      }),
    ).toBe('returning');
    expect(
      nextMonsterMode({
        distanceToHero: 10,
        distanceFromSpawn: 0,
        heroInSafeZone: true,
        heroAlive: true,
        aggroRadius: 140,
        leashRadius: 260,
      }),
    ).toBe('returning');
    expect(canMonsterAttack(false)).toBe(false);
  });
  it('respawns on schedule and grants once', () => {
    expect(monsterRespawnReady(6000, 1000, 5000)).toBe(true);
    const reward = { granted: false };
    expect(awardDefeatOnce(reward)).toBe(true);
    expect(awardDefeatOnce(reward)).toBe(false);
  });
});
