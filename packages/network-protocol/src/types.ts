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

export type ClientFocusTargetCommand = {
  type: 'focus-target';
  targetMonsterId: string | null;
  clientSentAtMs: number;
};

export type ClientAutoHuntCommand = {
  type: 'auto-hunt';
  enabled: boolean;
  clientSentAtMs: number;
};

export type ClientCommand =
  | ClientMoveCommand
  | ClientHeartbeatCommand
  | ClientFocusTargetCommand
  | ClientAutoHuntCommand;

export type HeroRole = 'fighter' | 'tank' | 'support';
export type HeroCombatStatus = 'alive' | 'defeated' | 'reviving';
export type AutoHuntState =
  | 'disabled'
  | 'acquiring-target'
  | 'navigating'
  | 'engaging'
  | 'retreating'
  | 'recovering'
  | 'waiting';
export type MonsterAiState =
  | 'idle'
  | 'wandering'
  | 'chasing'
  | 'attacking'
  | 'windup'
  | 'charging'
  | 'healing'
  | 'returning'
  | 'defeated'
  | 'respawning';
export type NetworkTimedStatusEffect = {
  type: 'movement-slow';
  magnitude: number;
  expirationTick: number;
};
export type NetworkHeroCombatState = {
  id: string;
  role: HeroRole;
  level: number;
  experience: number;
  nextExperience: number;
  currentHp: number;
  maxHp: number;
  status: HeroCombatStatus;
  targetMonsterId: string | null;
  statusEffects: NetworkTimedStatusEffect[];
};
export type NetworkPlayerCombatState = {
  playerId: string;
  heroes: NetworkHeroCombatState[];
  sessionGold: number;
  autoHuntEnabled: boolean;
  autoHuntState: AutoHuntState;
  focusedMonsterId: string | null;
  autoHuntTargetMonsterId: string | null;
  teamRespawnAtTick: number | null;
};
export type NetworkMonsterState = {
  id: string;
  definitionId: string;
  name: string;
  level: number;
  x: number;
  y: number;
  direction: CardinalDirection;
  currentHp: number;
  maxHp: number;
  status: 'alive' | 'defeated' | 'respawning';
  aiState: MonsterAiState;
  targetPlayerId: string | null;
  targetHeroId: string | null;
  spawnGeneration: number;
};
export type CombatEventType =
  | 'hero-attack'
  | 'monster-attack'
  | 'damage'
  | 'monster-heal'
  | 'slow-applied'
  | 'charge-warning'
  | 'charge-impact'
  | 'monster-defeated'
  | 'reward-granted'
  | 'hero-defeated'
  | 'hero-revived'
  | 'team-wipe'
  | 'team-respawn'
  | 'hero-level-up';
export type CombatEvent = {
  id: string;
  tick: number;
  type: CombatEventType;
  sourceId?: string;
  targetId?: string;
  amount?: number;
  playerId?: string;
  rewardIdentity?: string;
  heroExperience?: number;
  livingHeroIds?: string[];
  defeatedHeroIds?: string[];
};

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
