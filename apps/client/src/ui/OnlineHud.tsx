import type { MultiplayerUiState } from '../game/multiplayer/MultiplayerBridge';

export function OnlineHud({ state, onLeave }: { state: MultiplayerUiState; onLeave: () => void }) {
  return (
    <div className="online-hud" data-testid="online-hud">
      <section className="online-room-panel" aria-label="Online room status">
        <span className={`connection ${state.connection}`}>{state.connection}</span>
        <strong>Room {state.roomCode || '—'}</strong>
        <span>{state.displayName || 'Player'}</span>
        <span>
          <b data-testid="player-count">
            {state.playerCount} / {state.maxPlayers}
          </b>{' '}
          players
        </span>
        <span>
          Latency: <b>{state.latencyMs === null ? '—' : `${state.latencyMs} ms`}</b>
        </span>
      </section>
      <button className="leave-room" onClick={onLeave}>
        Leave Room
      </button>
      {state.error && (
        <div role="alert" className="network-error">
          {state.error}
        </div>
      )}
      {state.connection === 'reconnecting' && (
        <div role="status" className="reconnecting-overlay">
          <strong>Reconnecting…</strong>
          <span>Your movement is paused while we restore the room.</span>
        </div>
      )}
    </div>
  );
}
