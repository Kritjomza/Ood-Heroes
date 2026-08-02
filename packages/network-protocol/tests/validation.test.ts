import { describe, expect, it } from 'vitest';
import {
  PROTOCOL_VERSION,
  normalizeDisplayName,
  normalizeRoomCode,
  validateClientCommand,
  validateCombatEvent,
  validateJoinOptions,
} from '../src/index';

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

  it('accepts focus selection, focus clearing, and exact Auto Hunt toggles', () => {
    expect(
      validateClientCommand({
        type: 'focus-target',
        targetMonsterId: 'spawn-12',
        clientSentAtMs: 1,
      }),
    ).toEqual({
      ok: true,
      value: { type: 'focus-target', targetMonsterId: 'spawn-12', clientSentAtMs: 1 },
    });
    expect(
      validateClientCommand({ type: 'focus-target', targetMonsterId: null, clientSentAtMs: 2 }).ok,
    ).toBe(true);
    expect(validateClientCommand({ type: 'auto-hunt', enabled: true, clientSentAtMs: 3 })).toEqual({
      ok: true,
      value: { type: 'auto-hunt', enabled: true, clientSentAtMs: 3 },
    });
  });

  it('accepts only bounded idempotent manual portal completion commands', () => {
    expect(
      validateClientCommand({
        type: 'complete-floor-one',
        requestId: 'portal-request-1',
        manualEntry: true,
        clientSentAtMs: 4,
      }),
    ).toEqual({
      ok: true,
      value: {
        type: 'complete-floor-one',
        requestId: 'portal-request-1',
        manualEntry: true,
        clientSentAtMs: 4,
      },
    });
    expect(
      validateClientCommand({
        type: 'complete-floor-one',
        requestId: '',
        manualEntry: true,
        clientSentAtMs: 4,
      }),
    ).toEqual({ ok: false, code: 'INVALID_COMMAND' });
  });

  it.each([
    { type: 'focus-target', targetMonsterId: '', clientSentAtMs: 1 },
    { type: 'focus-target', targetMonsterId: 'x'.repeat(65), clientSentAtMs: 1 },
    { type: 'focus-target', targetMonsterId: 'bad\u0000id', clientSentAtMs: 1 },
    { type: 'auto-hunt', enabled: 1, clientSentAtMs: 1 },
    { type: 'auto-hunt', enabled: true, clientSentAtMs: Infinity },
  ])('rejects malformed combat command %#', (command) => {
    expect(validateClientCommand(command)).toEqual({ ok: false, code: 'INVALID_COMMAND' });
  });
});

describe('combat event validation and versioning', () => {
  it('uses protocol version 4 and rejects mismatched clients', () => {
    expect(PROTOCOL_VERSION).toBe(4);
    expect(validateJoinOptions({ displayName: 'Player', protocolVersion: 3 })).toEqual({
      ok: false,
      code: 'PROTOCOL_MISMATCH',
    });
  });

  it('accepts known bounded combat events and rejects unknown or malformed events', () => {
    expect(
      validateCombatEvent({
        id: 'evt-1',
        tick: 10,
        type: 'damage',
        amount: 12,
        targetId: 'spawn-1',
      }).ok,
    ).toBe(true);
    expect(validateCombatEvent({ id: 'evt-2', tick: 10, type: 'not-real' })).toEqual({
      ok: false,
      code: 'INVALID_COMMAND',
    });
    expect(validateCombatEvent({ id: '', tick: 10, type: 'damage' })).toEqual({
      ok: false,
      code: 'INVALID_COMMAND',
    });
    expect(validateCombatEvent({ id: 'evt-3', tick: Number.NaN, type: 'damage' })).toEqual({
      ok: false,
      code: 'INVALID_COMMAND',
    });
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
