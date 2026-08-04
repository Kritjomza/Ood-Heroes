import { describe, expect, it } from 'vitest';
import {
  MMO_PROTOCOL_VERSION,
  MmoProtocolValidationError,
  parseMmoCommandEnvelope,
  parseMmoEntryRequest,
} from '../src/mmo/validation';

describe('MMO protocol validation', () => {
  it('accepts a strict protocol-v4 entry request and returns a fresh value', () => {
    const input = {
      protocolVersion: 4,
      requestId: 'request-1',
      preferredRegion: 'asia-se',
      accessToken: 'access-token-1',
    };

    const parsed = parseMmoEntryRequest(input);

    expect(MMO_PROTOCOL_VERSION).toBe(4);
    expect(parsed).toEqual(input);
    expect(parsed).not.toBe(input);
  });

  it.each([
    ['old version', { protocolVersion: 3, requestId: 'request-1', preferredRegion: 'asia-se', accessToken: 'token' }],
    ['unknown field', { protocolVersion: 4, requestId: 'request-1', preferredRegion: 'asia-se', accessToken: 'token', extra: true }],
    ['empty request id', { protocolVersion: 4, requestId: '', preferredRegion: 'asia-se', accessToken: 'token' }],
    ['empty access token', { protocolVersion: 4, requestId: 'request-1', preferredRegion: 'asia-se', accessToken: '' }],
  ])('rejects an entry request with %s', (_label, input) => {
    expect(() => parseMmoEntryRequest(input)).toThrow(MmoProtocolValidationError);
  });

  it('reports protocol mismatch distinctly', () => {
    try {
      parseMmoEntryRequest({ protocolVersion: 3, requestId: 'request-1', preferredRegion: 'asia-se', accessToken: 'token' });
      expect.unreachable('expected a protocol mismatch');
    } catch (error) {
      expect(error).toMatchObject({ code: 'protocol_mismatch' });
    }
  });

  it.each([
    ['negative sequence', envelope({ sequence: -1 })],
    ['floating revision', envelope({ worldRevision: 2.5 })],
    ['diagonal movement', envelope({ command: { type: 'movement', direction: 'up-left' } })],
    ['empty target id', envelope({ command: { type: 'target-preference', targetId: '' } })],
    ['unknown command', envelope({ command: { type: 'teleport', x: 1, y: 1 } })],
    ['coerced sequence', envelope({ sequence: '2' })],
  ])('rejects a command envelope with %s', (_label, input) => {
    expect(() => parseMmoCommandEnvelope(input)).toThrow(MmoProtocolValidationError);
  });

  it('accepts each initial command without retaining unknown input objects', () => {
    const commands = [
      { type: 'movement', direction: 'idle' },
      { type: 'target-preference', targetId: null },
      { type: 'auto-hunt', enabled: true },
      { type: 'interact', targetId: 'sanctuary-1' },
    ] as const;

    for (const command of commands) {
      const input = envelope({ command });
      const parsed = parseMmoCommandEnvelope(input);
      expect(parsed.command).toEqual(command);
      expect(parsed).not.toBe(input);
      expect(parsed.command).not.toBe(command);
    }
  });
});

function envelope(overrides: Record<string, unknown> = {}) {
  return {
    protocolVersion: 4,
    sessionId: 'session-1',
    sequence: 2,
    worldRevision: 8,
    command: { type: 'movement', direction: 'right' },
    ...overrides,
  };
}
