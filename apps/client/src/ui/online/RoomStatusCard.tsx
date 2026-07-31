import type { MultiplayerUiState } from '../../game/multiplayer/MultiplayerBridge';
import { CONNECTION_COPY } from './copy';

export function RoomStatusCard({
  state,
  onLeave,
}: {
  state: MultiplayerUiState;
  onLeave: () => void;
}) {
  return (
    <section className="online-room-panel cartoon-panel" aria-label="Online room status">
      <div className="room-heading">
        <span aria-hidden="true">⌂</span>
        <strong>Room {state.roomCode || '—'}</strong>
      </div>
      <span className={`connection ${state.connection}`} aria-live="polite">
        ● {CONNECTION_COPY[state.connection]}
      </span>
      <span>
        <b data-testid="player-count">
          {state.playerCount} / {state.maxPlayers}
        </b>{' '}
        players
      </span>
      <span>
        Latency: <b>{state.latencyMs === null ? '—' : `${state.latencyMs} ms`}</b>
      </span>
      <button className="leave-room" onClick={onLeave}>
        Leave Room
      </button>
    </section>
  );
}
