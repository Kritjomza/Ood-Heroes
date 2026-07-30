// @vitest-environment node
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { boot, type ColyseusTestServer } from '@colyseus/testing';
import { NETWORK_CONFIG, PROTOCOL_VERSION } from '@odd-tower/network-protocol';
import { createGameServer } from '../src/app';

let server: ColyseusTestServer;
beforeAll(async () => {
  server = await boot(createGameServer(undefined, undefined, { reconnectGraceSeconds: 0.2 }));
});
afterEach(async () => server.cleanup());
afterAll(async () => server.shutdown());
const options = (displayName: string) => ({ displayName, protocolVersion: PROTOCOL_VERSION });
const silenceExpectedConnectionLogs = () => {
  const spies = [
    vi.spyOn(console, 'log').mockImplementation(() => undefined),
    vi.spyOn(console, 'warn').mockImplementation(() => undefined),
    vi.spyOn(console, 'error').mockImplementation(() => undefined),
  ];
  return () => spies.forEach((spy) => spy.mockRestore());
};

describe('FloorOneRoom integration', () => {
  it('creates one room, joins two players, and replicates authoritative movement', async () => {
    const room = await server.createRoom('floor_1', options('Creator'));
    const first = await server.connectTo(room, options('Creator'));
    const second = await server.connectTo(room, options('Second'));
    await vi.waitFor(() => expect(first.state.players.size).toBe(2));
    expect(second.state.players.size).toBe(2);

    const local = first.state.players.get(first.sessionId)!;
    const before = local.x;
    first.send('command', {
      type: 'move',
      sequence: 1,
      direction: 'right',
      clientSentAtMs: Date.now(),
    });
    await vi.waitFor(() => expect(local.x).toBeGreaterThan(before));
    expect(local.lastProcessedInputSequence).toBe(1);
  });

  it('supports ten players, rejects the eleventh, and cleans state on consented leave', async () => {
    const room = await server.createRoom('floor_1', options('P0'));
    const clients = [];
    for (let index = 0; index < NETWORK_CONFIG.roomCapacity; index++)
      clients.push(await server.connectTo(room, options(`P${index}`)));
    await vi.waitFor(() => expect(clients[0]!.state.players.size).toBe(10));
    await expect(server.connectTo(room, options('P10'))).rejects.toBeDefined();
    await clients[9]!.leave(true);
    await vi.waitFor(() => expect(clients[0]!.state.players.size).toBe(9));
  });

  it('rejects malformed join options before adding a player', async () => {
    const room = await server.createRoom('floor_1', options('Creator'));
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      await expect(
        server.connectTo(room, { displayName: 'Bad\u0000Name', protocolVersion: PROTOCOL_VERSION }),
      ).rejects.toBeDefined();
    } finally {
      error.mockRestore();
    }
    expect(room.state.players.size).toBe(0);
  });

  it('preserves one session across a successful reconnect', async () => {
    const restoreLogs = silenceExpectedConnectionLogs();
    const room = await server.createRoom('floor_1', options('Reconnect'));
    const first = await server.connectTo(room, options('Reconnect'));
    const sessionId = first.sessionId;
    const token = first.reconnectionToken;
    first.reconnection.maxRetries = 0;
    first.connection.close();
    await vi.waitFor(() => expect(room.state.players.get(sessionId)?.connected).toBe(false));

    try {
      const reconnected = await server.sdk.reconnect(token);
      expect(reconnected.sessionId).toBe(sessionId);
      await vi.waitFor(() => expect(room.state.players.get(sessionId)?.connected).toBe(true));
      expect(room.state.players.size).toBe(1);
      await reconnected.leave(true);
    } finally {
      restoreLogs();
    }
  });

  it('removes an expired reconnecting player and rejects its old token', async () => {
    const restoreLogs = silenceExpectedConnectionLogs();
    const room = await server.createRoom('floor_1', options('Expired'));
    const first = await server.connectTo(room, options('Expired'));
    const sessionId = first.sessionId;
    const token = first.reconnectionToken;
    first.reconnection.maxRetries = 0;
    first.connection.close();
    await vi.waitFor(() => expect(room.state.players.has(sessionId)).toBe(false), {
      timeout: 1_000,
    });
    try {
      await expect(server.sdk.reconnect(token)).rejects.toBeDefined();
    } finally {
      restoreLogs();
    }
  });
});
