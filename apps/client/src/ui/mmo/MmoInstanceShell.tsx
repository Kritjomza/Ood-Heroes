import type { MmoInstanceUiState } from '../../mmo/MmoInstanceClient';

export function MmoInstanceShell({ state, onReady, onRevive, onComplete, onLeave }: {
  state: Readonly<MmoInstanceUiState>;
  onReady: () => void;
  onRevive: () => void;
  onComplete: () => void;
  onLeave: () => void;
}) {
  return <main className="mmo-instance-shell" aria-label="Private adventure instance">
    {state.connection === 'recovering' && <div role="status">Restoring checkpoint…</div>}
    <header><span>{state.kind === 'dungeon' ? 'Dungeon' : 'Story mission'}</span><strong>{state.status}</strong></header>
    <p aria-live="polite">Encounter {Math.min(state.encounterIndex + 1, state.encounterCount)} / {state.encounterCount} · {state.objective}</p>
    <progress max={100} value={state.encounterProgress} aria-label="Encounter progress" />
    <p>{state.memberCount} players · {state.readyCount} ready · {state.reviveTokens} revive tokens</p>
    <div className="mmo-instance-actions">
      <button type="button" onClick={onReady} disabled={state.status !== 'forming'}>Ready up</button>
      <button type="button" onClick={onRevive} disabled={state.kind !== 'dungeon' || state.reviveTokens < 1}>Revive</button>
      <button type="button" onClick={onComplete} disabled={state.status !== 'active'}>Complete</button>
      <button type="button" onClick={onLeave}>Return to world</button>
    </div>
  </main>;
}
