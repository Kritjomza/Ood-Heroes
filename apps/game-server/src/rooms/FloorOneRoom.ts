import { Client, CloseCode, Room } from '@colyseus/core';
import { safePlayerSpawn } from '@odd-tower/game-core';
import {
  NETWORK_CONFIG,
  validateClientCommand,
  validateJoinOptions,
  type JoinOptions,
} from '@odd-tower/network-protocol';
import { RoomCodeRegistry } from '../lobby/RoomCodeRegistry.js';
import { FloorOneState, PlayerSchema } from '../schema/RoomState.js';
import {
  acceptPlayerCommand,
  createSimulationPlayer,
  stopPlayer,
  tickPlayer,
  type SimulationPlayer,
} from '../simulation/playerSimulation.js';
import { ClientRateLimiter } from '../validation/rateLimiter.js';

type RoomOptions = { registry: RoomCodeRegistry; reconnectGraceSeconds?: number };

export class FloorOneRoom extends Room<{
  state: FloorOneState;
  metadata: Record<string, unknown>;
}> {
  private registry!: RoomCodeRegistry;
  private readonly simulations = new Map<string, SimulationPlayer>();
  private readonly rateLimiter = new ClientRateLimiter();
  private reconnectGraceSeconds: number = NETWORK_CONFIG.reconnectGraceSeconds;

  async onCreate(options: RoomOptions) {
    this.registry = options.registry;
    this.reconnectGraceSeconds =
      options.reconnectGraceSeconds ?? NETWORK_CONFIG.reconnectGraceSeconds;
    this.maxClients = NETWORK_CONFIG.roomCapacity;
    this.patchRate = 1000 / NETWORK_CONFIG.patchHz;
    this.maxMessagesPerSecond = Infinity;
    const roomCode = this.registry.register(this.roomId, this.maxClients);
    this.state = new FloorOneState();
    this.state.roomId = this.roomId;
    this.state.roomCode = roomCode;
    this.state.maxPlayers = this.maxClients;
    await this.setMetadata({ roomCode, floorId: 'floor_1' });
    this.onMessage('command', (client, value: unknown) => this.handleCommand(client, value));
    this.setSimulationInterval(() => this.simulate(), NETWORK_CONFIG.tickMs);
  }

  onAuth(_client: Client, options: unknown) {
    const result = validateJoinOptions(options);
    if (!result.ok) throw new Error(result.code);
    return result.value;
  }

  onJoin(client: Client, options: JoinOptions) {
    const validated = validateJoinOptions(options);
    if (!validated.ok) throw new Error(validated.code);
    const spawn = safePlayerSpawn(this.state.players.size);
    const simulation = createSimulationPlayer(client.sessionId, validated.value.displayName, spawn);
    this.simulations.set(client.sessionId, simulation);
    const player = new PlayerSchema();
    Object.assign(player, simulation.state);
    this.state.players.set(client.sessionId, player);
    this.updateMetadata();
  }

  onDrop(client: Client, code?: number) {
    const simulation = this.simulations.get(client.sessionId);
    const player = this.state.players.get(client.sessionId);
    if (simulation) {
      simulation.state.connected = false;
      stopPlayer(simulation);
    }
    if (player) {
      player.connected = false;
      player.direction = 'none';
      player.moving = false;
    }
    if (code !== CloseCode.SERVER_SHUTDOWN)
      void this.allowReconnection(client, this.reconnectGraceSeconds);
  }

  onReconnect(client: Client) {
    const simulation = this.simulations.get(client.sessionId);
    const player = this.state.players.get(client.sessionId);
    if (simulation) {
      simulation.state.connected = true;
      simulation.lastValidInputAtMs = Date.now();
      stopPlayer(simulation);
    }
    if (player) player.connected = true;
  }

  onLeave(client: Client) {
    this.simulations.delete(client.sessionId);
    this.state.players.delete(client.sessionId);
    this.rateLimiter.remove(client.sessionId);
    this.updateMetadata();
  }

  onDispose() {
    this.simulations.clear();
    this.registry.removeByRoomId(this.roomId);
  }

  private handleCommand(client: Client, value: unknown) {
    const rate = this.rateLimiter.consume(client.sessionId, Date.now());
    if (rate !== 'accepted') {
      client.send('error', { code: 'RATE_LIMITED' });
      if (rate === 'disconnect') client.leave(4008, 'Persistent command rate exceeded');
      return;
    }
    const command = validateClientCommand(value);
    if (!command.ok) {
      client.send('error', { code: command.code });
      return;
    }
    const simulation = this.simulations.get(client.sessionId);
    if (!simulation) return;
    const result = acceptPlayerCommand(simulation, command.value, Date.now());
    if (result !== 'accepted') {
      client.send('error', { code: 'STALE_SEQUENCE' });
      return;
    }
    if (command.value.type === 'heartbeat')
      client.send('heartbeat', { clientSentAtMs: command.value.clientSentAtMs });
  }

  private simulate() {
    const now = Date.now();
    for (const [id, simulation] of this.simulations) {
      tickPlayer(simulation, now);
      const player = this.state.players.get(id);
      if (player) Object.assign(player, simulation.state);
    }
  }

  private updateMetadata() {
    this.state.playerCount = this.state.players.size;
    this.registry.updatePlayerCount(this.roomId, this.state.playerCount);
    void this.setMetadata({
      roomCode: this.state.roomCode,
      floorId: 'floor_1',
      playerCount: this.state.playerCount,
      maxPlayers: this.maxClients,
    });
  }
}
