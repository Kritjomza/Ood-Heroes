// @vitest-environment node
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { boot, type ColyseusTestServer } from '@colyseus/testing';
import { createGameServer } from '../../src/app';
import { ChannelRegistry } from '../../src/mmo/channels/ChannelRegistry';
import { WorldDirectory } from '../../src/mmo/directory/WorldDirectory';
import type { WorldCheckpointRepository } from '../../src/mmo/persistence/WorldCheckpointRepository';

let server: ColyseusTestServer;
let nextChannel = 1;
let nextLease = 1;
const accountIds = Array.from({ length: 31 }, (_, index) => `account-${index + 1}`);

beforeAll(async () => {
  const channels = new ChannelRegistry({
    capacity: 30,
    createId: () => `channel-${nextChannel++}`,
    nowMs: () => Date.now(),
  });
  const directory = new WorldDirectory({
    channels,
    createLeaseId: () => `lease-${nextLease++}`,
    leaseDurationMs: 15_000,
  });
  const checkpoints: WorldCheckpointRepository = {
    load: async () => null,
    saveIfNewer: async () => 'saved',
  };
  server = await boot(
    createGameServer(undefined, undefined, {}, undefined, {
      flags: { worldEnabled: true, allowAll: true, eligibleAccountIds: new Set(accountIds) },
      authVerifier: {
        verifyAccessToken: async (token) => ({
          userId: token,
          accountKind: 'permanent',
          email: null,
        }),
      },
      directory,
      checkpoints,
      reconnectGraceSeconds: 0.1,
    }),
  );
});
afterEach(async () => server.cleanup());
afterAll(async () => server.shutdown());

describe('MMO zone room foundation', () => {
  it('authenticates protocol v4 and publishes channel identity and population', async () => {
    const room = await server.createRoom('mmo_zone_v1', options('account-1'));
    const client = await server.connectTo(room, options('account-1'));

    await vi.waitFor(() => expect(client.state.population).toBe(1));
    expect(client.state.zoneId).toBe('floor-1');
    expect(client.state.channelId).toMatch(/^channel-/u);
    expect(client.state.worldRevision).toBeGreaterThan(0);
    expect(client.state.connectionState).toBe('connected');
  });

  it('rejects incompatible, unauthenticated, and ineligible entry before admission', async () => {
    const room = await server.createRoom('mmo_zone_v1', options('account-1'));
    const silence = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      await expect(
        server.connectTo(room, { ...options('account-1'), protocolVersion: 3 }),
      ).rejects.toBeDefined();
      await expect(server.connectTo(room, options(''))).rejects.toBeDefined();
      await expect(server.connectTo(room, options('account-99'))).rejects.toBeDefined();
    } finally {
      silence.mockRestore();
    }
    expect(room.state.population).toBe(0);
  });

  it('caps a channel at 30 accounts and releases population on consented leave', async () => {
    const room = await server.createRoom('mmo_zone_v1', options('account-1'));
    const clients = [];
    for (const accountId of accountIds.slice(0, 30))
      clients.push(await server.connectTo(room, options(accountId)));
    await vi.waitFor(() => expect(clients[0]!.state.population).toBe(30));
    await expect(server.connectTo(room, options('account-31'))).rejects.toBeDefined();

    await clients[29]!.leave(true);
    await vi.waitFor(() => expect(clients[0]!.state.population).toBe(29));
  });
});

function options(accountId: string) {
  return {
    protocolVersion: 4,
    requestId: `request-${accountId || 'empty'}`,
    preferredRegion: 'asia-se',
    accessToken: accountId,
  };
}
