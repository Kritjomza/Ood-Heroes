import { useId, useState } from 'react';

export function OnlineLobby({
  busy,
  error,
  onCreate,
  onJoin,
  onBack,
}: {
  busy: boolean;
  error: string;
  onCreate: (displayName: string) => void;
  onJoin: (displayName: string, roomCode: string) => void;
  onBack: () => void;
}) {
  const [displayName, setDisplayName] = useState('Traveler');
  const [roomCode, setRoomCode] = useState('');
  const errorId = useId();
  return (
    <section className="menu-card online-lobby" aria-labelledby="online-title">
      <p className="eyebrow">Phase 2</p>
      <h1 id="online-title">Online Movement Sandbox</h1>
      <p>
        Movement and player presence are server-authoritative. Combat is available in Local mode.
      </p>
      <div className="lobby-fields">
        <label>
          Display name
          <input
            value={displayName}
            maxLength={20}
            autoComplete="nickname"
            aria-describedby={error ? errorId : undefined}
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </label>
        <label>
          Room code
          <input
            value={roomCode}
            maxLength={6}
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            aria-describedby={error ? errorId : undefined}
            onChange={(event) => setRoomCode(event.target.value)}
          />
        </label>
      </div>
      {error && (
        <p id={errorId} role="alert" className="form-error">
          {error}
        </p>
      )}
      <div className="lobby-actions">
        <button disabled={busy} onClick={() => onCreate(displayName)}>
          {busy ? 'Connecting…' : 'Create Room'}
        </button>
        <button disabled={busy} onClick={() => onJoin(displayName, roomCode)}>
          Join Room
        </button>
        <button className="secondary" disabled={busy} onClick={onBack}>
          Back to mode selection
        </button>
      </div>
    </section>
  );
}
