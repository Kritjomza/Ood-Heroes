// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { RoomCodeRegistry } from '../src/lobby/RoomCodeRegistry';

describe('room-code registry', () => {
  it('registers a unique six-character code and resolves normalized input', () => {
    const registry = new RoomCodeRegistry(() => 'ABC234');
    expect(registry.register('room-1')).toBe('ABC234');
    expect(registry.resolve(' abc234 ')).toEqual({
      ok: true,
      value: { roomId: 'room-1', roomCode: 'ABC234', playerCount: 0, maxPlayers: 10 },
    });
  });

  it('retries a duplicate code and never silently resolves unknown or full rooms', () => {
    const codes = ['ABC234', 'ABC234', 'XYZ789'];
    const registry = new RoomCodeRegistry(() => codes.shift()!);
    registry.register('room-1');
    expect(registry.register('room-2')).toBe('XYZ789');
    expect(registry.resolve('ZZZ999')).toEqual({ ok: false, code: 'ROOM_NOT_FOUND' });
    registry.updatePlayerCount('room-1', 10);
    expect(registry.resolve('ABC234')).toEqual({ ok: false, code: 'ROOM_FULL' });
  });

  it('removes codes and does not retain entries across repeated disposal', () => {
    let value = 0;
    const registry = new RoomCodeRegistry(() => `ABC${234 + value++}`);
    for (let index = 0; index < 5; index++) {
      const code = registry.register(`room-${index}`);
      registry.removeByRoomId(`room-${index}`);
      expect(registry.resolve(code)).toEqual({ ok: false, code: 'ROOM_NOT_FOUND' });
    }
    expect(registry.size).toBe(0);
  });
});
