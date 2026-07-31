// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { COMBAT_CONFIG } from '@odd-tower/game-core';
import { CombatSimulation } from '../src/simulation/CombatSimulation';
import { createSimulationPlayer } from '../src/simulation/playerSimulation';

describe('accelerated ten-minute shared combat', () => {
  it('keeps monsters, events, rewards, and Auto Hunt bounded across repeated kills and respawns', () => {
    const combat = new CombatSimulation('sustained', 44);
    const a = createSimulationPlayer('a', 'Alpha', { x: 1024, y: 1024 });
    const b = createSimulationPlayer('b', 'Bravo', { x: 1088, y: 1024 });
    combat.addPlayer('a');
    combat.addPlayer('b');
    const simulations = new Map([
      ['a', a],
      ['b', b],
    ]);
    const dustBall = combat
      .monsterSnapshots()
      .find((monster) => monster.definitionId === 'shoe-biting-dust-ball')!;
    Object.assign(a.state, { x: dustBall.x, y: dustBall.y });
    for (let tick = 0; tick < 100; tick++) combat.tick(simulations);
    Object.assign(a.state, { x: 1024, y: 1024 });
    combat.setAutoHunt('a', true);
    combat.setAutoHunt('b', true);
    for (let tick = 100; tick < 12_000; tick++) combat.tick(simulations);

    const monsters = combat.monsterSnapshots();
    const respawns = monsters.reduce((sum, monster) => sum + monster.spawnGeneration - 1, 0);
    const rewards = combat.events().filter((event) => event.type === 'reward-granted');
    expect(monsters).toHaveLength(36);
    expect(respawns).toBeGreaterThan(0);
    expect(
      combat.playerSnapshot('a')!.sessionGold + combat.playerSnapshot('b')!.sessionGold,
    ).toBeGreaterThan(0);
    expect(new Set(rewards.map((event) => event.id)).size).toBe(rewards.length);
    expect(combat.events().length).toBeLessThanOrEqual(COMBAT_CONFIG.eventLimit);
    expect([
      'disabled',
      'acquiring-target',
      'navigating',
      'engaging',
      'retreating',
      'recovering',
      'waiting',
    ]).toContain(combat.playerSnapshot('a')!.autoHuntState);
    expect(combat.diagnostics()).toMatchObject({ ticks: 12_000, monsterCount: 36 });
    expect(combat.diagnostics().monsterKills).toBeGreaterThan(0);
    expect(combat.diagnostics().monsterRespawns).toBeGreaterThan(0);
    expect(combat.diagnostics().rewardGrants).toBeGreaterThan(0);
    expect(combat.diagnostics().chargeExecutions).toBeGreaterThan(0);
    expect(combat.diagnostics().healExecutions).toBeGreaterThan(0);
    expect(combat.diagnostics().slowApplications).toBeGreaterThan(0);
    expect(combat.diagnostics().pendingEvents).toBeLessThanOrEqual(COMBAT_CONFIG.eventLimit);
    expect(combat.diagnostics().processedRewardKeys).toBeLessThanOrEqual(72);
    expect(combat.diagnostics().contributionEntries).toBeLessThanOrEqual(72);
    expect(combat.diagnostics().pathCacheEntries).toBeLessThanOrEqual(36 * 64);
    expect(combat.diagnostics().spatialEntries).toBeLessThanOrEqual(42);
    console.log(JSON.stringify(combat.diagnostics()));
  }, 15_000);
});
