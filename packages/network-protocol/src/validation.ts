import { PROTOCOL_VERSION, ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH } from './config.js';
import type { CardinalDirection, ClientCommand, JoinOptions, ValidationResult } from './types.js';

const directions = new Set<CardinalDirection>(['up', 'down', 'left', 'right', 'none']);
const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isSequence = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

export function validateClientCommand(
  value: unknown,
): ValidationResult<ClientCommand, 'INVALID_COMMAND'> {
  if (!isObject(value) || !isSequence(value.sequence) || !isFiniteNumber(value.clientSentAtMs))
    return { ok: false, code: 'INVALID_COMMAND' };
  if (value.type === 'heartbeat')
    return {
      ok: true,
      value: { type: 'heartbeat', sequence: value.sequence, clientSentAtMs: value.clientSentAtMs },
    };
  if (value.type !== 'move' || !directions.has(value.direction as CardinalDirection))
    return { ok: false, code: 'INVALID_COMMAND' };
  return {
    ok: true,
    value: {
      type: 'move',
      sequence: value.sequence,
      direction: value.direction as CardinalDirection,
      clientSentAtMs: value.clientSentAtMs,
    },
  };
}

export function normalizeRoomCode(value: unknown): ValidationResult<string, 'INVALID_ROOM_CODE'> {
  if (typeof value !== 'string') return { ok: false, code: 'INVALID_ROOM_CODE' };
  const code = value.trim().toUpperCase();
  if (
    code.length !== ROOM_CODE_LENGTH ||
    [...code].some((character) => !ROOM_CODE_ALPHABET.includes(character))
  )
    return { ok: false, code: 'INVALID_ROOM_CODE' };
  return { ok: true, value: code };
}

export function normalizeDisplayName(
  value: unknown,
): ValidationResult<string, 'INVALID_DISPLAY_NAME'> {
  if (typeof value !== 'string') return { ok: false, code: 'INVALID_DISPLAY_NAME' };
  const displayName = value.trim();
  if (
    !displayName ||
    displayName.length > 20 ||
    [...displayName].some((character) => {
      const codePoint = character.codePointAt(0)!;
      return codePoint <= 31 || codePoint === 127;
    })
  )
    return { ok: false, code: 'INVALID_DISPLAY_NAME' };
  return { ok: true, value: displayName };
}

export function validateJoinOptions(
  value: unknown,
): ValidationResult<JoinOptions, 'INVALID_DISPLAY_NAME' | 'PROTOCOL_MISMATCH'> {
  if (!isObject(value) || value.protocolVersion !== PROTOCOL_VERSION)
    return { ok: false, code: 'PROTOCOL_MISMATCH' };
  const name = normalizeDisplayName(value.displayName);
  return name.ok
    ? { ok: true, value: { displayName: name.value, protocolVersion: PROTOCOL_VERSION } }
    : name;
}
