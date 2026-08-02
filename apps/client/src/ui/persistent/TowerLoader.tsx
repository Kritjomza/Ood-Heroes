import { AdventureIcon } from './AdventureIcons';

export type LoadingPhase = 'auth' | 'bootstrap' | 'oauth' | 'mutation';
const loadingCopy: Record<LoadingPhase, string> = {
  auth: 'Opening your tower…',
  bootstrap: 'Gathering your heroes…',
  oauth: 'Restoring your adventure…',
  mutation: 'Counting your treasure…',
};

export function TowerLoader({
  phase,
  error,
  onRetry,
}: {
  phase: LoadingPhase;
  error?: string | null;
  onRetry?: () => void;
}) {
  return (
    <main className="persistent-shell loading-screen tower-loading-screen" aria-busy={!error}>
      <section
        className={`tower-loader ${error ? 'is-stuck' : ''}`}
        role="status"
        aria-live="polite"
      >
        <div className="loader-scene" aria-hidden="true">
          <span className="loader-cloud" />
          <span className="loader-tower loader-tower-base" />
          <span className="loader-tower loader-tower-top" />
          <span className="loader-flag" />
          <span className="loader-window" />
        </div>
        <h1>{error ? 'The drawbridge got stuck' : loadingCopy[phase]}</h1>
        <p>{error ?? 'Your saved adventure is almost ready.'}</p>
        {error && onRetry && (
          <button className="plastic-button plastic-button-primary" onClick={onRetry}>
            <AdventureIcon name="play" />
            Try again
          </button>
        )}
      </section>
    </main>
  );
}
