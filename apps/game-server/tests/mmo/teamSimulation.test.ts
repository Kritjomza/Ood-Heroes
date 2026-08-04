import { describe, expect, it } from 'vitest';
import { TeamSimulation, type MmoTeamHero } from '../../src/mmo/simulation/TeamSimulation.js';

const heroes: MmoTeamHero[] = [
  { id: 'leader', role: 'fighter', position: { x: 0, y: 0 }, currentHp: 100, maxHp: 100, attack: 40, defense: 10, level: 1, cooldownTicks: 1, status: 'alive' },
  { id: 'tank', role: 'tank', position: { x: -120, y: 80 }, currentHp: 120, maxHp: 120, attack: 20, defense: 20, level: 1, cooldownTicks: 1, status: 'alive' },
  { id: 'support', role: 'support', position: { x: 120, y: 80 }, currentHp: 80, maxHp: 80, attack: 15, defense: 8, level: 1, cooldownTicks: 1, status: 'alive' },
];

describe('MMO three-hero team simulation', () => {
  it('moves only the Leader directly and reforms companions behind it', () => {
    const simulation = new TeamSimulation();
    simulation.addTeam('account-1', heroes);
    simulation.movement('account-1', 'right');
    const state = simulation.getTeam('account-1')!;
    expect(state.heroes.find((hero) => hero.id === 'leader')!.position.x).toBe(16);
    expect(state.heroes.find((hero) => hero.id === 'tank')!.position).toEqual({ x: -32, y: -42 });
    expect(state.heroes.find((hero) => hero.id === 'support')!.position).toEqual({ x: -32, y: 42 });
  });

  it('keeps automatic attacks active while Auto Hunt only controls navigation', () => {
    const simulation = new TeamSimulation();
    simulation.addTeam('account-1', heroes);
    simulation.addMonster('account-1', { id: 'monster-1', position: { x: 32, y: 0 }, currentHp: 500, maxHp: 500, attack: 1, defense: 2, status: 'alive' });
    simulation.setAutoHunt('account-1', true);
    simulation.movement('account-1', 'right');
    simulation.tick();
    const state = simulation.getTeam('account-1')!;
    expect(state.autoHuntEnabled).toBe(true);
    expect(state.monsters[0].currentHp).toBeLessThan(500);
  });

  it('disables Auto Hunt on full defeat, then respawns at sanctuary with weakness', () => {
    const simulation = new TeamSimulation({ respawnDelayTicks: 2, weaknessDurationTicks: 5 });
    simulation.addTeam('account-1', heroes, { x: 500, y: 500 });
    for (const hero of heroes) simulation.applyDamage('account-1', hero.id, hero.maxHp);
    simulation.setAutoHunt('account-1', true);
    simulation.tick();
    expect(simulation.getTeam('account-1')!.autoHuntEnabled).toBe(false);
    simulation.tick();
    simulation.tick();
    const respawned = simulation.getTeam('account-1')!;
    expect(respawned.heroes.every((hero) => hero.currentHp === hero.maxHp)).toBe(true);
    expect(respawned.heroes.every((hero) => hero.position.x === 500 && hero.position.y === 500)).toBe(true);
    expect(respawned.weaknessUntilTick).toBeGreaterThan(simulation.currentTick);
  });
});
