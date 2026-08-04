import type { MmoWorldUiState } from '../../mmo/MmoWorldBridge';

type Props = {
  state: Readonly<MmoWorldUiState>;
  onRetry: () => void;
  onReturnToLegacy: () => void;
};

const progressCopy = {
  idle: 'Preparing your adventure',
  locating: 'Finding your best channel',
  joining: 'Opening the world gate',
  recovering: 'Restoring your adventure',
} as const;

export function MmoEntryScreen({ state, onRetry, onReturnToLegacy }: Props) {
  if (state.connection === 'incompatible') {
    return (
      <main className="mmo-entry">
        <section className="mmo-entry-card" role="alert">
          <span className="mmo-entry-mark" aria-hidden="true">
            !
          </span>
          <p className="mmo-eyebrow">A newer world is ready</p>
          <h1>Update Odd Tower</h1>
          <p>Your current version cannot safely enter this world yet.</p>
          <button className="mmo-secondary-button" type="button" onClick={onReturnToLegacy}>
            Return to current adventure
          </button>
        </section>
      </main>
    );
  }

  if (state.connection === 'failed') {
    return (
      <main className="mmo-entry">
        <section className="mmo-entry-card" role="alert">
          <span className="mmo-entry-mark" aria-hidden="true">
            ↻
          </span>
          <p className="mmo-eyebrow">The gate did not open</p>
          <h1>Connection interrupted</h1>
          <p>Your saved adventure is safe. Try the channel again or return for now.</p>
          <div className="mmo-entry-actions">
            <button className="mmo-primary-button" type="button" onClick={onRetry}>
              Try again
            </button>
            <button className="mmo-secondary-button" type="button" onClick={onReturnToLegacy}>
              Return to current adventure
            </button>
          </div>
        </section>
      </main>
    );
  }

  const copy = progressCopy[state.connection as keyof typeof progressCopy] ?? 'Entering the world';
  return (
    <main className="mmo-entry">
      <section className="mmo-entry-card" role="status" aria-live="polite">
        <span className="mmo-gate-spinner" aria-hidden="true" />
        <p className="mmo-eyebrow">Persistent world</p>
        <h1>{copy}</h1>
        <p>Keeping your party together and checking your latest safe checkpoint.</p>
      </section>
    </main>
  );
}
