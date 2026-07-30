export type PlayerId = string;
export type InputSequence = number;
export type CardinalDirection = 'up' | 'down' | 'left' | 'right' | 'none';

export type ClientMoveCommand = {
  type: 'move';
  sequence: InputSequence;
  direction: CardinalDirection;
  clientSentAtMs: number;
};

export type ClientHeartbeatCommand = {
  type: 'heartbeat';
  sequence: InputSequence;
  clientSentAtMs: number;
};

export type ClientCommand = ClientMoveCommand | ClientHeartbeatCommand;

export type NetworkPlayerState = {
  id: PlayerId;
  displayName: string;
  x: number;
  y: number;
  direction: CardinalDirection;
  moving: boolean;
  connected: boolean;
  lastProcessedInputSequence: InputSequence;
};

export type RoomSummary = {
  roomId: string;
  roomCode: string;
  floorId: 'floor_1';
  playerCount: number;
  maxPlayers: number;
};

export type NetworkErrorCode =
  | 'INVALID_COMMAND'
  | 'INVALID_DISPLAY_NAME'
  | 'INVALID_ROOM_CODE'
  | 'ROOM_NOT_FOUND'
  | 'ROOM_FULL'
  | 'RATE_LIMITED'
  | 'STALE_SEQUENCE'
  | 'RECONNECT_EXPIRED'
  | 'PROTOCOL_MISMATCH'
  | 'SERVER_ERROR';

export type ConnectionState =
  | 'offline'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'failed';

export type JoinOptions = { displayName: string; protocolVersion: number };
export type ValidationResult<T, C extends NetworkErrorCode> =
  | { ok: true; value: T }
  | { ok: false; code: C };
