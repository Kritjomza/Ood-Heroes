export const PROTOCOL_VERSION = 4;
export const NETWORK_CONFIG = {
  simulationHz: 20,
  tickMs: 50,
  patchHz: 20,
  inputHz: 20,
  inputTimeoutMs: 500,
  playerSpeed: 120,
  playerRadius: 15,
  maxPendingInputs: 64,
  maxSequenceJump: 10_000,
  smoothCorrectionMin: 4,
  hardSnapDistance: 64,
  interpolationDelayMs: 100,
  interpolationBufferLimit: 20,
  extrapolationLimitMs: 150,
  reconnectGraceSeconds: 15,
  ratePerSecond: 30,
  rateBurst: 10,
  abuseDisconnectThreshold: 5,
  pingIntervalMs: 1000,
  maxLatencySamples: 10,
  roomCapacity: 10,
  maxEntityIdLength: 64,
  maxCombatEvents: 128,
  maxClientEventIds: 256,
  focusRatePerSecond: 8,
  autoHuntRatePerSecond: 4,
} as const;

export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const ROOM_CODE_LENGTH = 6;
