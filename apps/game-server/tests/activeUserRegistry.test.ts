// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { ActiveUserRegistry } from '../src/auth/ActiveUserRegistry';

describe('ActiveUserRegistry', () => {
  it('reserves one room per user and permits only the same-room reconnect', () => {
    const registry = new ActiveUserRegistry();
    expect(registry.reserve('user-a', 'room-a')).toEqual({ ok: true });
    expect(registry.reserve('user-a', 'room-b')).toEqual({
      ok: false,
      code: 'PLAYER_ALREADY_CONNECTED',
    });
    expect(registry.reconnect('user-a', 'room-a')).toEqual({ ok: true });
    expect(registry.reconnect('user-a', 'room-b')).toEqual({
      ok: false,
      code: 'PLAYER_ALREADY_CONNECTED',
    });
  });

  it('releases idempotently and can clean every user owned by a disposed room', () => {
    const registry = new ActiveUserRegistry();
    registry.reserve('user-a', 'room-a');
    registry.reserve('user-b', 'room-a');
    registry.reserve('user-c', 'room-c');
    registry.release('user-a', 'room-a');
    registry.release('user-a', 'room-a');
    expect(registry.isActive('user-a')).toBe(false);
    expect(registry.releaseRoom('room-a')).toBe(1);
    expect(registry.isActive('user-b')).toBe(false);
    expect(registry.isActive('user-c')).toBe(true);
  });
});
