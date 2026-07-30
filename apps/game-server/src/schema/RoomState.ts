import { MapSchema, Schema, defineTypes } from '@colyseus/schema';
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

export class FloorOneState extends Schema {
  declare roomId: string;
  declare roomCode: string;
  declare floorId: 'floor_1';
  declare playerCount: number;
  declare maxPlayers: number;
  declare players: MapSchema<PlayerSchema>;

  constructor() {
    super();
    this.roomId = '';
    this.roomCode = '';
    this.floorId = 'floor_1';
    this.playerCount = 0;
    this.maxPlayers = 10;
    this.players = new MapSchema<PlayerSchema>();
  }
}
defineTypes(FloorOneState, {
  roomId: 'string',
  roomCode: 'string',
  floorId: 'string',
  playerCount: 'number',
  maxPlayers: 'number',
  players: { map: PlayerSchema },
});
