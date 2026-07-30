import type { ConnectionState } from '@odd-tower/network-protocol';

export type MultiplayerUiState = {
  connection: ConnectionState;
  roomCode: string;
  playerCount: number;
  maxPlayers: number;
  latencyMs: number | null;
  displayName: string;
  error: string;
};

export const initialMultiplayerState: MultiplayerUiState = {
  connection: 'offline',
  roomCode: '',
  playerCount: 0,
  maxPlayers: 10,
  latencyMs: null,
  displayName: '',
  error: '',
};

export class MultiplayerBridge {
  private readonly listeners = new Set<(state: MultiplayerUiState) => void>();
  state: MultiplayerUiState = { ...initialMultiplayerState };

  get listenerCount() {
    return this.listeners.size;
  }

  subscribe(listener: (state: MultiplayerUiState) => void) {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  update(update: Partial<MultiplayerUiState>) {
    this.state = { ...this.state, ...update };
    for (const listener of this.listeners) listener(this.state);
  }

  reset() {
    this.state = { ...initialMultiplayerState };
    for (const listener of this.listeners) listener(this.state);
  }
}
