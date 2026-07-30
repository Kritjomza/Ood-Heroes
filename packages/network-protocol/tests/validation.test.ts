import { describe, expect, it } from 'vitest';
import { normalizeDisplayName, normalizeRoomCode, validateClientCommand } from '../src/index';

describe('client command validation', () => {
  it('accepts a complete cardinal movement command', () => {
    expect(
      validateClientCommand({
        type: 'move',
        sequence: 4,
        direction: 'left',
        clientSentAtMs: 1250,
      }),
    ).toEqual({
      ok: true,
      value: { type: 'move', sequence: 4, direction: 'left', clientSentAtMs: 1250 },
    });
  });

  it.each([
    ['invalid type', { type: 'teleport', sequence: 1, direction: 'left', clientSentAtMs: 1 }],
    ['invalid direction', { type: 'move', sequence: 1, direction: 'north', clientSentAtMs: 1 }],
    ['negative sequence', { type: 'move', sequence: -1, direction: 'up', clientSentAtMs: 1 }],
    ['floating sequence', { type: 'move', sequence: 1.5, direction: 'up', clientSentAtMs: 1 }],
    ['NaN sequence', { type: 'move', sequence: Number.NaN, direction: 'up', clientSentAtMs: 1 }],
    ['infinite timestamp', { type: 'heartbeat', sequence: 1, clientSentAtMs: Infinity }],
    ['malformed object', null],
  ])('rejects %s', (_name, command) => {
    expect(validateClientCommand(command)).toEqual({ ok: false, code: 'INVALID_COMMAND' });
  });
});

describe('room-code normalization', () => {
  it('trims and uppercases a valid code', () => {
    expect(normalizeRoomCode('  abc234 ')).toEqual({ ok: true, value: 'ABC234' });
  });

  it.each(['ABC10I', 'ABC-23', 'ABCDE', 'ABCDEFG'])('rejects invalid code %s', (code) => {
    expect(normalizeRoomCode(code)).toEqual({ ok: false, code: 'INVALID_ROOM_CODE' });
  });
});

describe('display-name normalization', () => {
  it('trims a visible name without escaping React-safe text', () => {
    expect(normalizeDisplayName('  Player One  ')).toEqual({ ok: true, value: 'Player One' });
  });

  it.each(['', '                     ', '123456789012345678901', 'Bad\u0000Name'])(
    'rejects %j',
    (name) => {
      expect(normalizeDisplayName(name)).toEqual({ ok: false, code: 'INVALID_DISPLAY_NAME' });
    },
  );
});
