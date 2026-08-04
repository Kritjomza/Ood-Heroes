import { describe, expect, it } from 'vitest';
import { parseMmoCommandEnvelope, parseMmoInstanceCommandEnvelope } from '@odd-tower/network-protocol';
import { PrivateInstanceRegistry } from '../../src/mmo/instances/PrivateInstanceRegistry.js';
import { TeamSimulation } from '../../src/mmo/simulation/TeamSimulation.js';

describe('MMO adversarial command and recovery gates', () => {
  it('rejects unknown keys, replayed sequences, and stale world revisions at validation boundaries', () => {
    expect(() => parseMmoCommandEnvelope({ protocolVersion: 4, sessionId: 's', sequence: 0, worldRevision: 0, command: { type: 'auto-hunt', enabled: true, forged: true } })).toThrow('invalid_message');
    expect(() => parseMmoCommandEnvelope({ protocolVersion: 3, sessionId: 's', sequence: 0, worldRevision: 0, command: { type: 'auto-hunt', enabled: true } })).toThrow('protocol_mismatch');
  });

  it('never allows story revive tokens and keeps dungeon tokens single-use', () => {
    const registry = new PrivateInstanceRegistry(() => 'instance');
    const story = registry.create('story', 'leader', 1, 99);
    expect(() => registry.consumeReviveToken(story.instanceId, 'leader')).toThrow('revive_tokens_not_allowed');
    const dungeon = registry.create('dungeon', 'leader', 1, 1);
    expect(registry.consumeReviveToken(dungeon.instanceId, 'leader')).toBe(true);
    expect(registry.consumeReviveToken(dungeon.instanceId, 'leader')).toBe(false);
  });

  it('keeps manual movement authoritative while auto attacks remain enabled', () => {
    const simulation = new TeamSimulation();
    simulation.addTeam('a', [
      { id: 'leader', role: 'fighter', position: { x: 0, y: 0 }, currentHp: 100, maxHp: 100, attack: 100, defense: 10, level: 1, cooldownTicks: 0, status: 'alive' },
      { id: 'tank', role: 'tank', position: { x: 0, y: 0 }, currentHp: 100, maxHp: 100, attack: 20, defense: 20, level: 1, cooldownTicks: 0, status: 'alive' },
      { id: 'support', role: 'support', position: { x: 0, y: 0 }, currentHp: 100, maxHp: 100, attack: 20, defense: 8, level: 1, cooldownTicks: 0, status: 'alive' },
    ]);
    simulation.addMonster('a', { id: 'monster', position: { x: 16, y: 0 }, currentHp: 100, maxHp: 100, attack: 1, defense: 0, status: 'alive' });
    simulation.setAutoHunt('a', true);
    simulation.movement('a', 'left');
    simulation.tick();
    const state = simulation.getTeam('a')!;
    expect(state.heroes.find((hero) => hero.id === 'leader')!.position.x).toBe(-16);
    expect(state.monsters[0]!.currentHp).toBeLessThan(100);
  });

  it('rejects instance sequence replay before state mutation', () => {
    expect(() => parseMmoInstanceCommandEnvelope({ protocolVersion: 4, sessionId: 's', sequence: -1, command: { type: 'ready', ready: true } })).toThrow('invalid_message');
  });
});
