import { ColyseusSDK, type Room } from '@colyseus/sdk';
import { MMO_PROTOCOL_VERSION, type MmoInstanceCommand } from '@odd-tower/network-protocol';

export type MmoInstanceUiState = {
  connection: 'idle' | 'joining' | 'connected' | 'recovering' | 'failed';
  instanceId: string;
  kind: string;
  status: string;
  memberCount: number;
  readyCount: number;
  checkpointRevision: number;
  encounterIndex: number;
  encounterCount: number;
  encounterProgress: number;
  objective: string;
  bossActive: boolean;
  reviveTokens: number;
  errorCode: string;
};

export const initialMmoInstanceState: Readonly<MmoInstanceUiState> = Object.freeze({
  connection: 'idle', instanceId: '', kind: 'story', status: 'forming', memberCount: 0, readyCount: 0,
  checkpointRevision: 0, encounterIndex: 0, encounterCount: 0, encounterProgress: 0, objective: 'prepare', bossActive: false,
  reviveTokens: 0, errorCode: '',
});

export class MmoInstanceClient {
  private room: Room<unknown, MmoInstanceUiState> | null = null;
  private sequence = 0;
  private state = initialMmoInstanceState;
  private readonly listeners = new Set<(state: Readonly<MmoInstanceUiState>) => void>();

  constructor(private readonly createSdk: (url: string) => ColyseusSDK, private readonly wsUrl: string) {}

  snapshot() { return this.state; }
  subscribe(listener: (state: Readonly<MmoInstanceUiState>) => void) { this.listeners.add(listener); listener(this.state); return () => this.listeners.delete(listener); }

  async connect(accessToken: string, instanceId: string) {
    this.state = { ...this.state, connection: 'joining', errorCode: '' };
    this.emit();
    try {
      const room = await this.createSdk(this.wsUrl).joinOrCreate<MmoInstanceUiState>('mmo_instance_v1', {
        protocolVersion: MMO_PROTOCOL_VERSION, requestId: crypto.randomUUID(), preferredRegion: 'auto', accessToken, instanceId,
      });
      this.room = room;
      this.apply(room.state);
      room.onStateChange((state) => this.apply(state));
      room.onDrop(() => { this.state = { ...this.state, connection: 'recovering' }; this.emit(); });
      room.onReconnect(() => { this.apply(room.state); });
      room.onLeave(() => { this.room = null; this.state = { ...this.state, connection: 'failed', errorCode: 'reconnection_expired' }; this.emit(); });
    } catch (error) {
      this.state = { ...this.state, connection: 'failed', errorCode: error instanceof Error ? error.message : 'connection_failed' };
      this.emit();
      throw error;
    }
  }

  ready(ready: boolean) { this.send({ type: 'ready', ready }); }
  checkpoint(revision: number, payload: Record<string, unknown>) { this.send({ type: 'checkpoint', revision, payload }); }
  revive() { this.send({ type: 'revive' }); }
  complete() { this.send({ type: 'complete' }); }
  async disconnect() { const room = this.room; this.room = null; if (room) await room.leave(true); this.state = initialMmoInstanceState; this.emit(); }

  private send(command: MmoInstanceCommand) {
    if (!this.room || this.state.connection !== 'connected') return;
    this.room.send('command', { protocolVersion: MMO_PROTOCOL_VERSION, sessionId: this.room.sessionId, sequence: this.sequence++, command });
  }

  private apply(next: MmoInstanceUiState) {
    this.state = { ...next, connection: 'connected', errorCode: '' };
    this.emit();
  }

  private emit() { for (const listener of this.listeners) listener(this.state); }
}
