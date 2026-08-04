import {
  MMO_PROTOCOL_VERSION,
  type MmoCommand,
  type MmoCommandEnvelope,
  type MmoEntryRequest,
  type MmoInstanceCommandEnvelope,
  type MmoInstanceEntryRequest,
  type MmoInstanceCommand,
  type MmoProtocolErrorCode,
} from './envelope.js';

export { MMO_PROTOCOL_VERSION } from './envelope.js';

export class MmoProtocolValidationError extends Error {
  constructor(readonly code: MmoProtocolErrorCode) {
    super(code);
    this.name = 'MmoProtocolValidationError';
  }
}

const entryKeys = ['accessToken', 'preferredRegion', 'protocolVersion', 'requestId'] as const;
const envelopeKeys = ['command', 'protocolVersion', 'sequence', 'sessionId', 'worldRevision'] as const;
const instanceEntryKeys = [...entryKeys, 'instanceId'] as const;
const instanceEnvelopeKeys = ['command', 'protocolVersion', 'sequence', 'sessionId'] as const;
const directions = new Set(['up', 'down', 'left', 'right', 'idle']);
type MmoDirection = Extract<MmoCommand, { type: 'movement' }>['direction'];

export function parseMmoEntryRequest(value: unknown): MmoEntryRequest {
  const record = requireRecord(value, entryKeys);
  requireProtocolVersion(record.protocolVersion);
  return {
    protocolVersion: MMO_PROTOCOL_VERSION,
    requestId: requireId(record.requestId),
    preferredRegion: requireId(record.preferredRegion),
    accessToken: requireAccessToken(record.accessToken),
  };
}

export function parseMmoInstanceEntryRequest(value: unknown): MmoInstanceEntryRequest {
  const record = requireRecord(value, instanceEntryKeys);
  requireProtocolVersion(record.protocolVersion);
  return {
    protocolVersion: MMO_PROTOCOL_VERSION,
    requestId: requireId(record.requestId),
    preferredRegion: requireId(record.preferredRegion),
    accessToken: requireAccessToken(record.accessToken),
    instanceId: requireId(record.instanceId),
  };
}

export function parseMmoInstanceCommandEnvelope(value: unknown): MmoInstanceCommandEnvelope {
  const record = requireRecord(value, instanceEnvelopeKeys);
  requireProtocolVersion(record.protocolVersion);
  return {
    protocolVersion: MMO_PROTOCOL_VERSION,
    sessionId: requireId(record.sessionId),
    sequence: requireSequence(record.sequence),
    command: parseInstanceCommand(record.command),
  };
}

export function parseMmoCommandEnvelope(value: unknown): MmoCommandEnvelope {
  const record = requireRecord(value, envelopeKeys);
  requireProtocolVersion(record.protocolVersion);
  return {
    protocolVersion: MMO_PROTOCOL_VERSION,
    sessionId: requireId(record.sessionId),
    sequence: requireSequence(record.sequence),
    worldRevision: requireSequence(record.worldRevision),
    command: parseCommand(record.command),
  };
}

function parseCommand(value: unknown): MmoCommand {
  if (!isRecord(value) || typeof value.type !== 'string') invalid();
  if (value.type === 'movement') {
    requireExactKeys(value, ['direction', 'type']);
    if (!directions.has(value.direction as string)) invalid();
    return { type: 'movement', direction: value.direction as MmoDirection };
  }
  if (value.type === 'target-preference') {
    requireExactKeys(value, ['targetId', 'type']);
    return {
      type: 'target-preference',
      targetId: value.targetId === null ? null : requireId(value.targetId),
    };
  }
  if (value.type === 'auto-hunt') {
    requireExactKeys(value, ['enabled', 'type']);
    if (typeof value.enabled !== 'boolean') invalid();
    return { type: 'auto-hunt', enabled: value.enabled };
  }
  if (value.type === 'interact') {
    requireExactKeys(value, ['targetId', 'type']);
    return { type: 'interact', targetId: requireId(value.targetId) };
  }
  if (value.type === 'party-invite') {
    requireExactKeys(value, ['targetAccountId', 'type']);
    return { type: 'party-invite', targetAccountId: requireId(value.targetAccountId) };
  }
  if (value.type === 'party-accept') {
    requireExactKeys(value, ['partyId', 'type']);
    return { type: 'party-accept', partyId: requireId(value.partyId) };
  }
  if (value.type === 'party-leave') {
    requireExactKeys(value, ['type']);
    return { type: 'party-leave' };
  }
  if (value.type === 'friend-consent') {
    requireExactKeys(value, ['granted', 'targetAccountId', 'type']);
    if (typeof value.granted !== 'boolean') invalid();
    return { type: 'friend-consent', targetAccountId: requireId(value.targetAccountId), granted: value.granted };
  }
  invalid();
}

function parseInstanceCommand(value: unknown): MmoInstanceCommand {
  if (!isRecord(value) || typeof value.type !== 'string') invalid();
  if (value.type === 'ready') {
    requireExactKeys(value, ['ready', 'type']);
    if (typeof value.ready !== 'boolean') invalid();
    return { type: 'ready', ready: value.ready };
  }
  if (value.type === 'checkpoint') {
    requireExactKeys(value, ['payload', 'revision', 'type']);
    if (!isRecord(value.payload)) invalid();
    return { type: 'checkpoint', revision: requireSequence(value.revision), payload: { ...value.payload } };
  }
  if (value.type === 'revive') {
    requireExactKeys(value, ['type']);
    return { type: 'revive' };
  }
  if (value.type === 'complete') {
    requireExactKeys(value, ['type']);
    return { type: 'complete' };
  }
  invalid();
}

function requireProtocolVersion(value: unknown): asserts value is typeof MMO_PROTOCOL_VERSION {
  if (value !== MMO_PROTOCOL_VERSION) throw new MmoProtocolValidationError('protocol_mismatch');
}

function requireSequence(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) invalid();
  return value;
}

function requireId(value: unknown): string {
  if (
    typeof value !== 'string' ||
    value.length < 1 ||
    value.length > 64 ||
    [...value].some((character) => {
      const point = character.codePointAt(0)!;
      return point <= 31 || point === 127;
    })
  )
    invalid();
  return value;
}

function requireAccessToken(value: unknown): string {
  if (typeof value !== 'string' || value.length < 1 || value.length > 4096) invalid();
  return value;
}

function requireRecord<const T extends readonly string[]>(
  value: unknown,
  keys: T,
): Record<T[number], unknown> {
  if (!isRecord(value)) invalid();
  requireExactKeys(value, keys);
  return value as Record<T[number], unknown>;
}

function requireExactKeys(value: Record<string, unknown>, keys: readonly string[]) {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (actual.length !== expected.length || actual.some((key, index) => key !== expected[index]))
    invalid();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function invalid(): never {
  throw new MmoProtocolValidationError('invalid_message');
}
