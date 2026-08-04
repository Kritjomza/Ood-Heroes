import { afterEach, describe, expect, it, vi } from 'vitest';
import { MmoWorldBridge } from '../src/mmo/MmoWorldBridge';
import { MmoWorldClient } from '../src/mmo/MmoWorldClient';

function signal<T extends (...args: never[]) => void>() {
  const listeners = new Set<T>();
  const subscribe = ((listener: T) => listeners.add(listener)) as unknown as ((listener: T) => void) & {
    emit: (...args: Parameters<T>) => void;
  };
  subscribe.emit = (...args) => listeners.forEach((listener) => listener(...args));
  return subscribe;
}

function fakeRoom() {
  return {
    sessionId: 'session-1',
    state: {
      channelId: 'channel-1',
      zoneId: 'floor-1',
      population: 1,
      maxPlayers: 30,
      worldRevision: 4,
      connectionState: 'connected',
    },
    reconnection: { minUptime: 5000, maxRetries: 15, maxDelay: 5000 },
    send: vi.fn(),
    leave: vi.fn(async () => 4000),
    removeAllListeners: vi.fn(),
    onStateChange: signal<(state: unknown) => void>(),
    onDrop: signal<() => void>(),
    onReconnect: signal<() => void>(),
    onLeave: signal<() => void>(),
    onError: signal<(code: number, message: string) => void>(),
  };
}

afterEach(() => vi.restoreAllMocks());

describe('MMO world client', () => {
  it('automatically joins protocol v4 and sends monotonic cardinal movement', async () => {
    const room = fakeRoom();
    const sdk = { joinOrCreate: vi.fn(async () => room) };
    const bridge = new MmoWorldBridge();
    const client = new MmoWorldClient(bridge, {
      createSdk: () => sdk as never,
      wsUrl: 'ws://server',
      preferredRegion: 'asia-se',
      createRequestId: () => 'request-1',
    });

    await client.connect('access-token');

    expect(sdk.joinOrCreate).toHaveBeenCalledWith('mmo_zone_v1', {
      protocolVersion: 4,
      requestId: 'request-1',
      preferredRegion: 'asia-se',
      accessToken: 'access-token',
    });
    expect(bridge.snapshot()).toMatchObject({
      connection: 'connected',
      channelId: 'channel-1',
      worldRevision: 4,
    });

    client.sendMovement('right');
    client.sendMovement('idle');
    expect(room.send).toHaveBeenNthCalledWith(1, 'command', {
      protocolVersion: 4,
      sessionId: 'session-1',
      sequence: 1,
      worldRevision: 4,
      command: { type: 'movement', direction: 'right' },
    });
    expect(room.send).toHaveBeenNthCalledWith(2, 'command', expect.objectContaining({ sequence: 2 }));
  });

  it('publishes recovery and reconnection without accepting stale snapshots', async () => {
    const room = fakeRoom();
    const bridge = new MmoWorldBridge();
    const client = new MmoWorldClient(bridge, { createSdk: () => ({ joinOrCreate: async () => room }) as never });
    await client.connect('access-token');

    room.onDrop.emit();
    expect(bridge.snapshot().connection).toBe('recovering');
    room.state.worldRevision = 5;
    room.onReconnect.emit();
    expect(bridge.snapshot()).toMatchObject({ connection: 'connected', worldRevision: 5 });
    room.onStateChange.emit({ ...room.state, worldRevision: 3, channelId: 'stale' });
    expect(bridge.snapshot().channelId).toBe('channel-1');
  });

  it('maps protocol mismatch distinctly and sends nothing before connection', async () => {
    const bridge = new MmoWorldBridge();
    const client = new MmoWorldClient(bridge, {
      createSdk: () => ({ joinOrCreate: async () => Promise.reject(new Error('protocol_mismatch')) }) as never,
    });
    client.sendMovement('right');

    await expect(client.connect('access-token')).rejects.toThrow('protocol_mismatch');
    expect(bridge.snapshot()).toMatchObject({ connection: 'incompatible', errorCode: 'protocol_mismatch' });
  });
});
