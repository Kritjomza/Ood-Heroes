// @vitest-environment node
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { boot, type ColyseusTestServer } from '@colyseus/testing';
import { createGameServer } from '../../src/app';
import { ChannelRegistry } from '../../src/mmo/channels/ChannelRegistry';
import { WorldDirectory } from '../../src/mmo/directory/WorldDirectory';
import { PrivateInstanceRegistry } from '../../src/mmo/instances/PrivateInstanceRegistry';
import type { WorldCheckpointRepository } from '../../src/mmo/persistence/WorldCheckpointRepository';

let server: ColyseusTestServer;
let instances: PrivateInstanceRegistry;

beforeAll(async () => {
  const channels = new ChannelRegistry({ capacity: 30, createId: () => 'channel-1', nowMs: () => 1 });
  const directory = new WorldDirectory({ channels, createLeaseId: () => 'lease-1', leaseDurationMs: 15_000 });
  instances = new PrivateInstanceRegistry(() => 'instance-1');
  server = await boot(createGameServer(undefined, undefined, {}, undefined, {
    flags: { worldEnabled: true, allowAll: true, eligibleAccountIds: new Set(['leader', 'member']) },
    authVerifier: { verifyAccessToken: async (token) => ({ userId: token, accountKind: 'permanent', email: null }) },
    directory,
    checkpoints: { load: async () => null, saveIfNewer: async () => 'saved' } satisfies WorldCheckpointRepository,
    instances,
  }));
});
afterEach(async () => server.cleanup());
afterAll(async () => server.shutdown());

describe('MMO private instance room', () => {
  it('admits members, publishes ready state, and accepts checkpoint commands', async () => {
    const created = instances.create('dungeon', 'leader', 42, 1);
    instances.addMember(created.instanceId, 'member');
    const room = await server.createRoom('mmo_instance_v1', {});
    const client = await server.connectTo(room, entry('leader', created.instanceId));
    await client.send('command', command(client.sessionId, 0, { type: 'ready', ready: true }));
    await client.send('command', command(client.sessionId, 1, { type: 'checkpoint', revision: 3, payload: { room: 2 } }));
    await vi.waitFor(() => expect(room.state.checkpointRevision).toBe(3));
    expect(room.state.instanceId).toBe(created.instanceId);
    expect(room.state.kind).toBe('dungeon');
    expect(room.state.checkpointRevision).toBe(3);
    expect(room.state.status).toBe('forming');
  });
});

function entry(accessToken: string, instanceId: string) {
  return { protocolVersion: 4, requestId: `request-${accessToken}`, preferredRegion: 'auto', accessToken, instanceId };
}

function command(sessionId: string, sequence: number, value: Record<string, unknown>) {
  return { protocolVersion: 4, sessionId, sequence, command: value };
}
