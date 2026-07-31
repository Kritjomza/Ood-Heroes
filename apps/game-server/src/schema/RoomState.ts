import { ArraySchema, MapSchema, Schema, defineTypes } from '@colyseus/schema';
import type { CardinalDirection, NetworkPlayerState } from '@odd-tower/network-protocol';

export class PlayerSchema extends Schema implements NetworkPlayerState {
  declare id: string;
  declare displayName: string;
  declare x: number;
  declare y: number;
  declare direction: CardinalDirection;
  declare moving: boolean;
  declare connected: boolean;
  declare lastProcessedInputSequence: number;

  constructor() {
    super();
    this.id = '';
    this.displayName = '';
    this.x = 0;
    this.y = 0;
    this.direction = 'none';
    this.moving = false;
    this.connected = true;
    this.lastProcessedInputSequence = 0;
  }
}
defineTypes(PlayerSchema, {
  id: 'string',
  displayName: 'string',
  x: 'number',
  y: 'number',
  direction: 'string',
  moving: 'boolean',
  connected: 'boolean',
  lastProcessedInputSequence: 'number',
});

export class StatusEffectSchema extends Schema {
  declare type: string;
  declare magnitude: number;
  declare expirationTick: number;
  constructor() {
    super();
    this.type = 'movement-slow';
    this.magnitude = 0;
    this.expirationTick = 0;
  }
}
defineTypes(StatusEffectSchema, { type: 'string', magnitude: 'number', expirationTick: 'number' });

export class HeroCombatSchema extends Schema {
  declare id: string;
  declare role: string;
  declare level: number;
  declare experience: number;
  declare nextExperience: number;
  declare currentHp: number;
  declare maxHp: number;
  declare status: string;
  declare targetMonsterId: string;
  declare statusEffects: ArraySchema<StatusEffectSchema>;
  constructor() {
    super();
    this.id = '';
    this.role = 'fighter';
    this.level = 1;
    this.experience = 0;
    this.nextExperience = 50;
    this.currentHp = 1;
    this.maxHp = 1;
    this.status = 'alive';
    this.targetMonsterId = '';
    this.statusEffects = new ArraySchema<StatusEffectSchema>();
  }
}
defineTypes(HeroCombatSchema, {
  id: 'string',
  role: 'string',
  level: 'number',
  experience: 'number',
  nextExperience: 'number',
  currentHp: 'number',
  maxHp: 'number',
  status: 'string',
  targetMonsterId: 'string',
  statusEffects: [StatusEffectSchema],
});

export class PlayerCombatSchema extends Schema {
  declare playerId: string;
  declare heroes: ArraySchema<HeroCombatSchema>;
  declare sessionGold: number;
  declare autoHuntEnabled: boolean;
  declare autoHuntState: string;
  declare focusedMonsterId: string;
  declare autoHuntTargetMonsterId: string;
  declare teamRespawnAtTick: number;
  constructor() {
    super();
    this.playerId = '';
    this.heroes = new ArraySchema<HeroCombatSchema>();
    this.sessionGold = 0;
    this.autoHuntEnabled = false;
    this.autoHuntState = 'disabled';
    this.focusedMonsterId = '';
    this.autoHuntTargetMonsterId = '';
    this.teamRespawnAtTick = -1;
  }
}
defineTypes(PlayerCombatSchema, {
  playerId: 'string',
  heroes: [HeroCombatSchema],
  sessionGold: 'number',
  autoHuntEnabled: 'boolean',
  autoHuntState: 'string',
  focusedMonsterId: 'string',
  autoHuntTargetMonsterId: 'string',
  teamRespawnAtTick: 'number',
});

export class MonsterSchema extends Schema {
  declare id: string;
  declare definitionId: string;
  declare name: string;
  declare level: number;
  declare x: number;
  declare y: number;
  declare direction: string;
  declare currentHp: number;
  declare maxHp: number;
  declare status: string;
  declare aiState: string;
  declare targetPlayerId: string;
  declare targetHeroId: string;
  declare spawnGeneration: number;
  constructor() {
    super();
    this.id = '';
    this.definitionId = '';
    this.name = '';
    this.level = 1;
    this.x = 0;
    this.y = 0;
    this.direction = 'none';
    this.currentHp = 1;
    this.maxHp = 1;
    this.status = 'alive';
    this.aiState = 'idle';
    this.targetPlayerId = '';
    this.targetHeroId = '';
    this.spawnGeneration = 1;
  }
}
defineTypes(MonsterSchema, {
  id: 'string',
  definitionId: 'string',
  name: 'string',
  level: 'number',
  x: 'number',
  y: 'number',
  direction: 'string',
  currentHp: 'number',
  maxHp: 'number',
  status: 'string',
  aiState: 'string',
  targetPlayerId: 'string',
  targetHeroId: 'string',
  spawnGeneration: 'number',
});

export class FloorOneState extends Schema {
  declare roomId: string;
  declare roomCode: string;
  declare floorId: 'floor_1';
  declare playerCount: number;
  declare maxPlayers: number;
  declare players: MapSchema<PlayerSchema>;
  declare monsters: MapSchema<MonsterSchema>;
  declare combatPlayers: MapSchema<PlayerCombatSchema>;
  declare serverTick: number;

  constructor() {
    super();
    this.roomId = '';
    this.roomCode = '';
    this.floorId = 'floor_1';
    this.playerCount = 0;
    this.maxPlayers = 10;
    this.players = new MapSchema<PlayerSchema>();
    this.monsters = new MapSchema<MonsterSchema>();
    this.combatPlayers = new MapSchema<PlayerCombatSchema>();
    this.serverTick = 0;
  }
}
defineTypes(FloorOneState, {
  roomId: 'string',
  roomCode: 'string',
  floorId: 'string',
  playerCount: 'number',
  maxPlayers: 'number',
  players: { map: PlayerSchema },
  monsters: { map: MonsterSchema },
  combatPlayers: { map: PlayerCombatSchema },
  serverTick: 'number',
});
