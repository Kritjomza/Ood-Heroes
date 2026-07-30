import { afterEach, describe, expect, it, vi } from 'vitest';
import { MultiplayerBridge } from '../src/game/multiplayer/MultiplayerBridge';
import { MultiplayerClient } from '../src/game/multiplayer/MultiplayerClient';

function signal<T extends (...args: never[]) => void>() {
  const listeners = new Set<T>();
  const subscribe = ((listener: T) => {
    listeners.add(listener);
    return { remove: () => listeners.delete(listener) };
  }) as unknown as ((listener: T) => void) & {
    emit: (...args: Parameters<T>) => void;
    remove: (listener: T) => void;
  };
  subscribe.emit = (...args) => listeners.forEach((listener) => listener(...args));
  subscribe.remove = (listener) => {
    listeners.delete(listener);
  };
  return subscribe;
}

function fakeRoom() {
  const player = {
    id: 'local',
    displayName: 'Player',
    x: 1024,
    y: 1024,
    direction: 'none',
    moving: false,
    connected: true,
    lastProcessedInputSequence: 0,
  };
  return {
    sessionId: 'local',
    reconnectionToken: 'token',
    reconnection: { minUptime: 5000, maxRetries: 15, maxDelay: 5000 },
    state: {
      roomCode: 'ABC234',
      playerCount: 1,
      maxPlayers: 10,
      players: new Map([['local', player]]),
    },
    send: vi.fn(),
    ping: vi.fn((callback: (latency: number) => void) => callback(42)),
    leave: vi.fn(async () => 4000),
    onStateChange: signal<(state: unknown) => void>(),
    onDrop: signal<() => void>(),
    onReconnect: signal<() => void>(),
    onLeave: signal<(code: number) => void>(),
    onError: signal<(code: number, message: string) => void>(),
    onMessage: vi.fn(() => () => {}),
    removeAllListeners: vi.fn(),
  };
}

afterEach(() => vi.useRealTimers());

describe('MultiplayerClient lifecycle', () => {
  it('creates, joins by exact room ID, sends controlled input, measures latency, and leaves cleanly', async () => {
    vi.useFakeTimers();
    const room = fakeRoom();
    const sdk = { joinById: vi.fn(async () => room) };
    const fetcher = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            roomId: 'room-1',
            roomCode: 'ABC234',
            floorId: 'floor_1',
            playerCount: 0,
            maxPlayers: 10,
          }),
          { status: 201, headers: { 'content-type': 'application/json' } },
        ),
    );
    const bridge = new MultiplayerBridge();
    const client = new MultiplayerClient(bridge, {
      fetcher,
      createSdk: () => sdk as never,
      wsUrl: 'ws://server',
      httpUrl: 'http://server',
    });

    await client.createRoom(' Player ');
    expect(sdk.joinById).toHaveBeenCalledWith('room-1', {
      displayName: 'Player',
      protocolVersion: 2,
    });
    expect(bridge.state).toMatchObject({ connection: 'connected', roomCode: 'ABC234' });

    client.setDirection('right');
    expect(room.send).toHaveBeenCalledWith(
      'command',
      expect.objectContaining({ type: 'move', direction: 'right', sequence: 1 }),
    );
    await vi.advanceTimersByTimeAsync(1000);
    expect(room.send.mock.calls.length).toBeGreaterThan(2);
    expect(bridge.state.latencyMs).toBe(42);

    await client.leave();
    expect(room.leave).toHaveBeenCalledWith(true);
    expect(room.removeAllListeners).toHaveBeenCalledOnce();
    expect(bridge.state.connection).toBe('offline');
  });

  it('surfaces a specific HTTP lobby error and leaves no partial connection', async () => {
    const bridge = new MultiplayerBridge();
    const client = new MultiplayerClient(bridge, {
      fetcher: async () =>
        new Response(JSON.stringify({ code: 'ROOM_NOT_FOUND', message: 'That room is gone.' }), {
          status: 404,
          headers: { 'content-type': 'application/json' },
        }),
      createSdk: () => ({ joinById: vi.fn() }) as never,
      wsUrl: 'ws://server',
      httpUrl: 'http://server',
    });
    await expect(client.joinRoom('Player', 'ZZZ999')).rejects.toThrow('That room is gone.');
    expect(bridge.state).toMatchObject({ connection: 'failed', error: 'That room is gone.' });
    expect(client.connected).toBe(false);
  });

  it('waits for the first complete schema state before consuming players', async () => {
    const room = fakeRoom();
    const complete = room.state;
    (room as { state: unknown }).state = { roomCode: '', playerCount: 0, maxPlayers: 10 };
    const bridge = new MultiplayerBridge();
    const client = new MultiplayerClient(bridge, {
      fetcher: async () =>
        new Response(
          JSON.stringify({
            roomId: 'room-1',
            roomCode: 'ABC234',
            floorId: 'floor_1',
            playerCount: 0,
            maxPlayers: 10,
          }),
          { status: 201, headers: { 'content-type': 'application/json' } },
        ),
      createSdk: () => ({ joinById: vi.fn(async () => room) }) as never,
      wsUrl: 'ws://server',
      httpUrl: 'http://server',
    });
    const connecting = client.createRoom('Player');
    setTimeout(() => {
      (room as { state: unknown }).state = complete;
      room.onStateChange.emit(complete);
    }, 0);
    await connecting;
    expect(client.localPlayerId).toBe('local');
    expect(client.getLocalPosition()).toEqual({ x: 1024, y: 1024 });
  });
});
