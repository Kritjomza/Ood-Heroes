export const MMO_PROTOCOL_VERSION = 4 as const;

export type MmoEntryRequest = {
  protocolVersion: typeof MMO_PROTOCOL_VERSION;
  requestId: string;
  preferredRegion: string;
  accessToken: string;
};

export type MmoInstanceEntryRequest = MmoEntryRequest & { instanceId: string };

export type MmoInstanceCommand =
  | { type: 'ready'; ready: boolean }
  | { type: 'checkpoint'; revision: number; payload: Record<string, unknown> }
  | { type: 'revive' }
  | { type: 'complete' };

export type MmoInstanceCommandEnvelope = {
  protocolVersion: typeof MMO_PROTOCOL_VERSION;
  sessionId: string;
  sequence: number;
  command: MmoInstanceCommand;
};

export type MmoCommand =
  | { type: 'movement'; direction: 'up' | 'down' | 'left' | 'right' | 'idle' }
  | { type: 'target-preference'; targetId: string | null }
  | { type: 'auto-hunt'; enabled: boolean }
  | { type: 'interact'; targetId: string }
  | { type: 'party-invite'; targetAccountId: string }
  | { type: 'party-accept'; partyId: string }
  | { type: 'party-leave' }
  | { type: 'friend-consent'; targetAccountId: string; granted: boolean };

export type MmoCommandEnvelope = {
  protocolVersion: typeof MMO_PROTOCOL_VERSION;
  sessionId: string;
  sequence: number;
  worldRevision: number;
  command: MmoCommand;
};

export type MmoProtocolErrorCode = 'protocol_mismatch' | 'invalid_message';
