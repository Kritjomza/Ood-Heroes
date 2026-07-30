import { describe, expect, it, vi } from 'vitest';
import {
  MultiplayerBridge,
  initialMultiplayerState,
} from '../src/game/multiplayer/MultiplayerBridge';

describe('MultiplayerBridge', () => {
  it('publishes meaningful connection changes and unsubscribes cleanly', () => {
    const bridge = new MultiplayerBridge();
    const listener = vi.fn();
    const unsubscribe = bridge.subscribe(listener);
    bridge.update({ connection: 'connected', roomCode: 'ABC234', playerCount: 2 });
    expect(listener).toHaveBeenLastCalledWith({
      ...initialMultiplayerState,
      connection: 'connected',
      roomCode: 'ABC234',
      playerCount: 2,
    });
    expect(bridge.listenerCount).toBe(1);
    unsubscribe();
    expect(bridge.listenerCount).toBe(0);
  });

  it('resets transient room data after leave while preserving no stale errors', () => {
    const bridge = new MultiplayerBridge();
    bridge.update({ connection: 'failed', error: 'Room missing', latencyMs: 50 });
    bridge.reset();
    expect(bridge.state).toEqual(initialMultiplayerState);
  });
});
