import { type FormEvent, useId, useState } from 'react';
import './online-lobby.css';

type LobbyPath = 'create' | 'join';

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
  const [path, setPath] = useState<LobbyPath>('create');
  const errorId = useId();
  const connectionState = busy ? 'opening' : error ? 'error' : 'idle';
  const formInvalid = !displayName.trim() || (path === 'join' && roomCode.trim().length !== 6);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || formInvalid) return;
    if (path === 'create') onCreate(displayName);
    else onJoin(displayName, roomCode);
  };

  return (
    <section
      className="tower-gate-lobby"
      data-path={path}
      data-connection-state={connectionState}
      aria-labelledby="online-title"
    >
      <button className="tower-gate-back" type="button" disabled={busy} onClick={onBack}>
        <span aria-hidden="true" />
        Back
      </button>

      <div className="tower-gate-scene" aria-hidden="true">
        <span className="tower-cloud tower-cloud--one" />
        <span className="tower-cloud tower-cloud--two" />
        <span className="tower-mountain tower-mountain--one" />
        <span className="tower-mountain tower-mountain--two" />
        <div className="tower-gate">
          <span className="tower-flag tower-flag--left" />
          <span className="tower-flag tower-flag--right" />
          <span className="tower-turret tower-turret--left" />
          <span className="tower-turret tower-turret--right" />
          <span className="tower-gate__crest"><i /></span>
          <div className="tower-gate__arch">
            <span className="tower-gate__glow" />
            <span className="tower-gate__door tower-gate__door--left" />
            <span className="tower-gate__door tower-gate__door--right" />
          </div>
          <div className="tower-gate__steps">
            <i />
            <i />
            <i />
          </div>
        </div>
        <div className="tower-gate__party">
          <span className="gate-party-hero gate-party-hero--one"><i /></span>
          <span className="gate-party-hero gate-party-hero--two"><i /></span>
          <span className="gate-party-hero gate-party-hero--three"><i /></span>
        </div>
      </div>

      <div className="tower-gate-panel">
        <header className="tower-gate-heading">
          <h1 id="online-title">Gather at the Tower Gate</h1>
          <p>Create a new expedition or join your party with a room code.</p>
        </header>

        <div className="tower-gate-paths" aria-label="Choose a room path">
          <button
            type="button"
            aria-label="Start an expedition"
            aria-pressed={path === 'create'}
            disabled={busy}
            onClick={() => setPath('create')}
          >
            <span className="path-mark path-mark--create" aria-hidden="true"><i /></span>
            <span><strong>Start an expedition</strong><small>Open a room for your party</small></span>
          </button>
          <button
            type="button"
            aria-label="Join your party"
            aria-pressed={path === 'join'}
            disabled={busy}
            onClick={() => setPath('join')}
          >
            <span className="path-mark path-mark--join" aria-hidden="true"><i /></span>
            <span><strong>Join your party</strong><small>Use a friend’s room code</small></span>
          </button>
        </div>

        <form className="tower-gate-form" onSubmit={submit}>
          <div className="tower-gate-fields" key={path}>
            <label>
              <span>Adventurer name</span>
              <input
                aria-label="Display name"
                value={displayName}
                maxLength={20}
                required
                autoComplete="nickname"
                disabled={busy}
                aria-describedby={error ? errorId : undefined}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </label>
            {path === 'join' && (
              <label>
                <span>Room code</span>
                <input
                  value={roomCode}
                  maxLength={6}
                  minLength={6}
                  required
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                  disabled={busy}
                  aria-describedby={error ? errorId : undefined}
                  onChange={(event) => setRoomCode(event.target.value)}
                />
              </label>
            )}
          </div>

          {error && (
            <p id={errorId} role="alert" className="tower-gate-error">
              <strong>The gate stayed shut.</strong>
              <span>
                {error}{' '}
                {path === 'join'
                  ? 'Check the room code and try again.'
                  : 'Check your connection and try again.'}
              </span>
            </p>
          )}

          <button
            className="tower-gate-submit"
            type="submit"
            aria-label={path === 'create' ? 'Create Room' : 'Join Room'}
            disabled={busy || formInvalid}
          >
            <span>{busy ? 'Opening the gate…' : path === 'create' ? 'Create room' : 'Join room'}</span>
            <i aria-hidden="true" />
          </button>

          {busy && (
            <p className="tower-gate-status" role="status">
              Opening the gate…
            </p>
          )}
        </form>
      </div>
      <div className="tower-gate-transition" aria-hidden="true" />
    </section>
  );
}
