import { ColyseusSDK, type Room } from '@colyseus/sdk';
import { MMO_PROTOCOL_VERSION, type MmoCommand } from '@odd-tower/network-protocol';
import { MmoWorldBridge, type MmoWorldSnapshot } from './MmoWorldBridge';

type MmoDirection = 'up' | 'down' | 'left' | 'right' | 'idle';

type Dependencies = {
  createSdk: (url: string) => ColyseusSDK;
  wsUrl: string;
  preferredRegion: string;
  createRequestId: () => string;
};

const defaults: Dependencies = {
  createSdk: (url) => new ColyseusSDK(url),
  wsUrl: import.meta.env.VITE_GAME_SERVER_URL ?? 'ws://127.0.0.1:2567',
  preferredRegion: 'auto',
  createRequestId: () => crypto.randomUUID(),
};

export class MmoWorldClient {
  private readonly dependencies: Dependencies;
  private room: Room<unknown, MmoWorldSnapshot> | null = null;
  private sequence = 0;
  private connecting = false;
  private leaving = false;

  constructor(
    private readonly bridge: MmoWorldBridge,
    dependencies: Partial<Dependencies> = {},
  ) {
    this.dependencies = { ...defaults, ...dependencies };
  }

  async connect(accessToken: string): Promise<void> {
    if (!accessToken) throw new Error('AUTH_REQUIRED');
    if (this.connecting || this.room) throw new Error('connection_active');
    this.connecting = true;
    this.bridge.update({ connection: 'locating', errorCode: '' });
    try {
      const sdk = this.dependencies.createSdk(this.dependencies.wsUrl);
      this.bridge.update({ connection: 'joining' });
      const room = await sdk.joinOrCreate<MmoWorldSnapshot>('mmo_zone_v1', {
        protocolVersion: MMO_PROTOCOL_VERSION,
        requestId: this.dependencies.createRequestId(),
        preferredRegion: this.dependencies.preferredRegion,
        accessToken,
      });
      this.room = room;
      this.attachRoom(room);
      this.bridge.applyWorldSnapshot(room.state);
      this.bridge.update({ connection: 'connected', errorCode: '' });
    } catch (error) {
      this.room = null;
      const message = error instanceof Error ? error.message : 'connection_failed';
      const protocolMismatch = /protocol_mismatch/iu.test(message);
      this.bridge.update({
        connection: protocolMismatch ? 'incompatible' : 'failed',
        errorCode: protocolMismatch ? 'protocol_mismatch' : 'connection_failed',
      });
      throw error;
    } finally {
      this.connecting = false;
    }
  }

  sendMovement(direction: MmoDirection): void {
    this.sendCommand({ type: 'movement', direction });
  }

  setAutoHunt(enabled: boolean): void {
    this.sendCommand({ type: 'auto-hunt', enabled });
    if (this.room && this.bridge.snapshot().connection === 'connected')
      this.bridge.update({ autoHuntEnabled: enabled });
  }

  setTargetPreference(targetId: string | null): void {
    this.sendCommand({ type: 'target-preference', targetId });
  }

  private sendCommand(command: MmoCommand): void {
    const room = this.room;
    if (!room || this.bridge.snapshot().connection !== 'connected') return;
    this.sequence += 1;
    room.send('command', {
      protocolVersion: MMO_PROTOCOL_VERSION,
      sessionId: room.sessionId,
      sequence: this.sequence,
      worldRevision: this.bridge.snapshot().worldRevision,
      command,
    });
  }

  async disconnect(): Promise<void> {
    this.leaving = true;
    const room = this.room;
    this.room = null;
    try {
      if (room) await room.leave(true);
    } finally {
      room?.removeAllListeners();
      this.sequence = 0;
      this.bridge.reset();
      this.leaving = false;
    }
  }

  private attachRoom(room: Room<unknown, MmoWorldSnapshot>) {
    room.reconnection.minUptime = 0;
    room.reconnection.maxRetries = 8;
    room.reconnection.maxDelay = 2_000;
    room.onStateChange((state) => this.bridge.applyWorldSnapshot(state));
    room.onDrop(() => this.bridge.update({ connection: 'recovering', errorCode: '' }));
    room.onReconnect(() => {
      this.bridge.applyWorldSnapshot(room.state);
      this.bridge.update({ connection: 'connected', errorCode: '' });
    });
    room.onLeave(() => {
      if (this.leaving) return;
      this.room = null;
      this.bridge.update({ connection: 'failed', errorCode: 'reconnection_expired' });
      room.removeAllListeners();
    });
    room.onError((_code, message) => {
      if (/protocol_mismatch/iu.test(message ?? ''))
        this.bridge.update({ connection: 'incompatible', errorCode: 'protocol_mismatch' });
    });
  }
}
