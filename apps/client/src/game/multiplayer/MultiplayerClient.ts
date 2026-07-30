import { ColyseusSDK, type Room } from '@colyseus/sdk';
import {
  NETWORK_CONFIG,
  PROTOCOL_VERSION,
  normalizeDisplayName,
  normalizeRoomCode,
  type CardinalDirection,
  type NetworkPlayerState,
  type RoomSummary,
} from '@odd-tower/network-protocol';
import type { Vector2 } from '@odd-tower/game-core';
import { MultiplayerBridge } from './MultiplayerBridge';
import { RemoteInterpolator } from './interpolation';
import { PredictionController } from './prediction';

type NetworkRoomState = RoomSummary & {
  players?: Map<string, NetworkPlayerState> & {
    forEach(callback: (value: NetworkPlayerState, key: string) => void): void;
  };
};

type Dependencies = {
  fetcher: typeof fetch;
  createSdk: (url: string) => ColyseusSDK;
  wsUrl: string;
  httpUrl: string;
};

const defaults: Dependencies = {
  fetcher: fetch.bind(globalThis),
  createSdk: (url) => new ColyseusSDK(url),
  wsUrl: import.meta.env.VITE_GAME_SERVER_URL ?? 'ws://127.0.0.1:2567',
  httpUrl: import.meta.env.VITE_GAME_SERVER_HTTP_URL ?? 'http://127.0.0.1:2567',
};

export class MultiplayerClient {
  private readonly dependencies: Dependencies;
  private sdk: ColyseusSDK | null = null;
  private room: Room<unknown, NetworkRoomState> | null = null;
  private prediction: PredictionController | null = null;
  private readonly interpolation = new RemoteInterpolator();
  private direction: CardinalDirection = 'none';
  private inputTimer: ReturnType<typeof setInterval> | null = null;
  private latencyTimer: ReturnType<typeof setInterval> | null = null;
  private latencySamples: number[] = [];
  private leaving = false;
  private connecting = false;
  private hardCorrection = false;

  constructor(
    private readonly bridge: MultiplayerBridge,
    dependencies: Partial<Dependencies> = {},
  ) {
    this.dependencies = { ...defaults, ...dependencies };
  }

  get connected() {
    return this.room !== null && this.bridge.state.connection === 'connected';
  }

  get localPlayerId() {
    return this.room?.sessionId ?? '';
  }

  async createRoom(displayName: string) {
    const name = this.requireDisplayName(displayName);
    return this.connectThroughLobby(name, 'POST', '/rooms');
  }

  async joinRoom(displayName: string, roomCode: string) {
    const name = this.requireDisplayName(displayName);
    const normalized = normalizeRoomCode(roomCode);
    if (!normalized.ok) return this.fail('Room codes contain six supported characters.');
    return this.connectThroughLobby(name, 'GET', `/rooms/${normalized.value}`);
  }

  setDirection(direction: CardinalDirection) {
    if (!this.connected || direction === this.direction) return;
    this.direction = direction;
    this.sendMove();
  }

  getLocalPosition(): Vector2 | null {
    return this.prediction?.position ?? null;
  }

  consumeHardCorrection() {
    const value = this.hardCorrection;
    this.hardCorrection = false;
    return value;
  }

  remotePlayerIds() {
    return [...this.currentPlayers().keys()].filter((id) => id !== this.localPlayerId);
  }

  sampleRemote(playerId: string, nowMs: number) {
    return this.interpolation.sample(playerId, nowMs - NETWORK_CONFIG.interpolationDelayMs);
  }

  currentPlayer(playerId: string) {
    return this.currentPlayers().get(playerId);
  }

  async leave() {
    this.leaving = true;
    this.stopTimers();
    const room = this.room;
    this.room = null;
    this.prediction?.disconnect();
    this.prediction = null;
    this.interpolation.clear();
    try {
      if (room) await room.leave(true);
    } finally {
      room?.removeAllListeners();
      this.direction = 'none';
      this.latencySamples = [];
      this.bridge.reset();
      this.leaving = false;
      this.connecting = false;
    }
  }

  private async connectThroughLobby(displayName: string, method: 'GET' | 'POST', path: string) {
    if (this.connecting || this.room) throw new Error('A connection attempt is already active.');
    this.connecting = true;
    this.bridge.update({ connection: 'connecting', displayName, error: '' });
    try {
      const summary = await this.requestRoom(method, path);
      this.sdk = this.dependencies.createSdk(this.dependencies.wsUrl);
      const room = await this.sdk.joinById<NetworkRoomState>(summary.roomId, {
        displayName,
        protocolVersion: PROTOCOL_VERSION,
      });
      this.attachRoom(room);
      await this.waitForInitialState(room);
      this.consumeState(room.state);
      this.bridge.update({
        connection: 'connected',
        roomCode: summary.roomCode,
        displayName,
        playerCount: room.state.playerCount,
        maxPlayers: room.state.maxPlayers,
      });
      this.startTimers();
      return summary;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to connect to the game server.';
      const partialRoom = this.room as Room<unknown, NetworkRoomState> | null;
      this.room = null;
      this.stopTimers();
      this.prediction?.disconnect();
      this.prediction = null;
      this.interpolation.clear();
      if (partialRoom) {
        try {
          await partialRoom.leave(true);
        } catch (leaveError) {
          if (import.meta.env.DEV)
            console.warn('Failed to close a partial room connection.', leaveError);
        } finally {
          partialRoom.removeAllListeners();
        }
      }
      this.connecting = false;
      this.bridge.update({ connection: 'failed', error: this.userMessage(message) });
      throw new Error(this.userMessage(message));
    } finally {
      this.connecting = false;
    }
  }

  private attachRoom(room: Room<unknown, NetworkRoomState>) {
    this.room = room;
    room.reconnection.minUptime = 0;
    room.reconnection.maxRetries = 8;
    room.reconnection.maxDelay = 2_000;
    room.onStateChange((state) => {
      if (this.hasCompleteState(state)) this.consumeState(state);
    });
    room.onDrop(() => {
      this.stopTimers();
      this.direction = 'none';
      this.prediction?.disconnect();
      this.bridge.update({ connection: 'reconnecting', latencyMs: null, error: '' });
    });
    room.onReconnect(() => {
      this.consumeState(room.state, true);
      this.bridge.update({ connection: 'connected', error: '' });
      this.startTimers();
    });
    room.onLeave(() => {
      if (this.leaving) return;
      this.stopTimers();
      this.room = null;
      this.prediction?.disconnect();
      this.interpolation.clear();
      this.bridge.update({
        connection: 'failed',
        latencyMs: null,
        error: 'Connection lost. Reconnection expired; return to the lobby.',
      });
      room.removeAllListeners();
    });
    room.onError((code, message) => {
      if (code) console.warn(`Multiplayer room error ${code}`);
      this.bridge.update({ error: this.userMessage(message ?? 'A multiplayer error occurred.') });
    });
    room.onMessage<{ clientSentAtMs: number }>('heartbeat', (message) => {
      if (Number.isFinite(message?.clientSentAtMs))
        this.recordLatency(Math.max(0, Date.now() - message.clientSentAtMs));
    });
    room.onMessage<{ code?: string }>('error', (message) => {
      if (message?.code === 'RATE_LIMITED')
        this.bridge.update({ error: 'Movement input is being sent too quickly.' });
    });
  }

  private consumeState(state: NetworkRoomState, reconnect = false) {
    if (!state.players) return;
    const receivedAt = performance.now();
    const seen = new Set<string>();
    state.players.forEach((player, id) => {
      seen.add(id);
      const plain: NetworkPlayerState = {
        id: player.id,
        displayName: player.displayName,
        x: player.x,
        y: player.y,
        direction: player.direction,
        moving: player.moving,
        connected: player.connected,
        lastProcessedInputSequence: player.lastProcessedInputSequence,
      };
      if (id === this.localPlayerId) {
        if (!this.prediction || reconnect)
          this.prediction = new PredictionController({ x: plain.x, y: plain.y });
        if (reconnect)
          this.prediction.reset({ x: plain.x, y: plain.y }, plain.lastProcessedInputSequence);
        else {
          const correction = this.prediction.reconcile(
            { x: plain.x, y: plain.y },
            plain.lastProcessedInputSequence,
          );
          this.hardCorrection ||= correction.kind === 'snap';
        }
      } else this.interpolation.add({ ...plain, atMs: receivedAt });
    });
    for (const id of this.interpolation.playerIds())
      if (!seen.has(id)) this.interpolation.remove(id);
    if (
      this.bridge.state.roomCode !== state.roomCode ||
      this.bridge.state.playerCount !== state.playerCount ||
      this.bridge.state.maxPlayers !== state.maxPlayers
    )
      this.bridge.update({
        roomCode: state.roomCode,
        playerCount: state.playerCount,
        maxPlayers: state.maxPlayers,
      });
  }

  private startTimers() {
    this.stopTimers();
    this.inputTimer = setInterval(() => {
      if (this.direction !== 'none') this.sendMove();
    }, NETWORK_CONFIG.tickMs);
    this.latencyTimer = setInterval(() => {
      const room = this.room;
      if (!room) return;
      room.ping((latencyMs) => this.recordLatency(latencyMs));
      if (this.direction === 'none' && this.prediction)
        room.send('command', this.prediction.createHeartbeat(Date.now()));
    }, NETWORK_CONFIG.pingIntervalMs);
  }

  private stopTimers() {
    if (this.inputTimer) clearInterval(this.inputTimer);
    if (this.latencyTimer) clearInterval(this.latencyTimer);
    this.inputTimer = null;
    this.latencyTimer = null;
  }

  private sendMove() {
    if (!this.room || !this.prediction) return;
    const command = this.prediction.applyInput(this.direction, Date.now());
    if (command) this.room.send('command', command);
  }

  private recordLatency(latencyMs: number) {
    if (!Number.isFinite(latencyMs)) return;
    this.latencySamples.push(latencyMs);
    if (this.latencySamples.length > NETWORK_CONFIG.maxLatencySamples) this.latencySamples.shift();
    const average = Math.round(
      this.latencySamples.reduce((sum, value) => sum + value, 0) / this.latencySamples.length,
    );
    this.bridge.update({ latencyMs: average });
  }

  private currentPlayers() {
    return this.room?.state.players ?? new Map<string, NetworkPlayerState>();
  }

  private hasCompleteState(state: NetworkRoomState) {
    return Boolean(state?.players && typeof state.players.forEach === 'function');
  }

  private async waitForInitialState(room: Room<unknown, NetworkRoomState>) {
    if (this.hasCompleteState(room.state)) return;
    await new Promise<void>((resolve, reject) => {
      const onState = (state: NetworkRoomState) => {
        if (!this.hasCompleteState(state)) return;
        clearTimeout(timeout);
        room.onStateChange.remove(onState);
        resolve();
      };
      const timeout = setTimeout(() => {
        room.onStateChange.remove(onState);
        reject(new Error('The server did not send initial room state.'));
      }, 5_000);
      room.onStateChange(onState);
    });
  }

  private requireDisplayName(value: string) {
    const name = normalizeDisplayName(value);
    if (!name.ok) throw new Error('Display name must be 1–20 visible characters.');
    return name.value;
  }

  private async requestRoom(method: 'GET' | 'POST', path: string): Promise<RoomSummary> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    try {
      const response = await this.dependencies.fetcher(`${this.dependencies.httpUrl}${path}`, {
        method,
        signal: controller.signal,
      });
      const body = (await response.json()) as Partial<RoomSummary> & { message?: string };
      if (!response.ok) throw new Error(body.message ?? 'The lobby request failed.');
      if (
        typeof body.roomId !== 'string' ||
        typeof body.roomCode !== 'string' ||
        body.floorId !== 'floor_1' ||
        !Number.isFinite(body.playerCount) ||
        !Number.isFinite(body.maxPlayers)
      )
        throw new Error('The server returned malformed room data.');
      return body as RoomSummary;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError')
        throw new Error('The game server took too long to respond.');
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private fail(message: string): never {
    this.bridge.update({ connection: 'failed', error: message });
    throw new Error(message);
  }

  private userMessage(message: string) {
    if (/Failed to fetch|NetworkError|ECONNREFUSED/iu.test(message))
      return 'The game server is unavailable. Check that it is running.';
    return message;
  }
}
