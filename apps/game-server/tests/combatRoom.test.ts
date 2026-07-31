// @vitest-environment node
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { boot, type ColyseusTestServer } from '@colyseus/testing';
import { PROTOCOL_VERSION } from '@odd-tower/network-protocol';
import { createGameServer } from '../src/app';

let server: ColyseusTestServer;
beforeAll(async () => {
  server = await boot(createGameServer());
});
afterEach(async () => server.cleanup());
afterAll(async () => server.shutdown());
const options = (displayName: string) => ({ displayName, protocolVersion: PROTOCOL_VERSION });

describe('FloorOneRoom shared combat', () => {
  it('replicates identical server-owned monsters and player combat state to two clients', async () => {
    const room = await server.createRoom('floor_1', options('Creator'));
    const a = await server.connectTo(room, options('Alpha'));
    const b = await server.connectTo(room, options('Bravo'));
    await vi.waitFor(() => expect(a.state.monsters?.size).toBeGreaterThanOrEqual(34));
    await vi.waitFor(() => expect(b.state.monsters?.size).toBe(a.state.monsters.size));
    expect([...a.state.monsters.keys()]).toEqual([...b.state.monsters.keys()]);
    expect(a.state.combatPlayers.get(a.sessionId).heroes.length).toBe(3);
    expect(b.state.combatPlayers.get(b.sessionId).sessionGold).toBe(0);
  });

  it('accepts validated focus and Auto Hunt commands under server authority', async () => {
    const room = await server.createRoom('floor_1', options('Creator'));
    const client = await server.connectTo(room, options('Hunter'));
    await vi.waitFor(() => expect(client.state.monsters?.size).toBeGreaterThanOrEqual(34));
    const targetId = [...client.state.monsters.keys()][0]!;
    client.send('command', {
      type: 'focus-target',
      targetMonsterId: targetId,
      clientSentAtMs: Date.now(),
    });
    await vi.waitFor(() =>
      expect(client.state.combatPlayers.get(client.sessionId).focusedMonsterId).toBe(targetId),
    );
    client.send('command', { type: 'auto-hunt', enabled: true, clientSentAtMs: Date.now() });
    await vi.waitFor(() =>
      expect(client.state.combatPlayers.get(client.sessionId).autoHuntEnabled).toBe(true),
    );
  });
});
