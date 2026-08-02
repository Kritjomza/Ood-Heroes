import { useState } from 'react';
import { getAuthClient } from '../../persistence/auth-client';
import { createOAuthCoordinator } from '../../persistence/oauth';

export function AuthScreen() {
  const [displayName, setDisplayName] = useState('Odd Hero');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (operation: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await operation();
    } catch {
      setError('We could not open the tower. Check your connection and try again.');
      setBusy(false);
    }
  };

  const google = () =>
    run(() =>
      createOAuthCoordinator(
        getAuthClient().auth,
        import.meta.env.VITE_APP_BASE_URL,
      ).signInWithGoogle(),
    );

  const guest = () =>
    run(async () => {
      const { error } = await getAuthClient().auth.signInAnonymously({
        options: { data: { display_name: displayName.trim() } },
      });
      if (error) throw error;
    });

  const nameMissing = !displayName.trim();

  return (
    <main className="persistent-shell auth-page">
      <div className="auth-adventure">
        <span className="auth-cloud auth-cloud-one" aria-hidden="true" />
        <span className="auth-cloud auth-cloud-two" aria-hidden="true" />
        <svg className="tower-mark" viewBox="0 0 240 250" aria-hidden="true">
          <path
            className="tower-shadow"
            d="M32 213c25-17 151-22 181 0 20 15-13 30-87 30s-117-15-94-30Z"
          />
          <path className="tower-body" d="M60 88h121v126H60z" />
          <path className="tower-roof" d="m48 93 29-46 29 46Zm78 0 28-57 30 57Z" />
          <path className="tower-detail" d="M75 124h29v34H75zm65-3h24v29h-24z" />
          <path className="tower-door" d="M105 214v-43c0-19 30-19 30 0v43Z" />
          <path className="tower-flag" d="M153 37V13m2 2h34l-9 10 9 10h-34" />
          <circle className="tower-cheek" cx="88" cy="181" r="7" />
          <circle className="tower-cheek" cx="153" cy="181" r="7" />
          <path className="tower-face" d="M96 176h1m45 0h1m-35 9c8 8 18 8 26 0" />
        </svg>
        <div className="adventure-copy">
          <span className="adventure-sticker">Tiny quests. Big weirdos.</span>
          <h1 id="auth-title">
            Odd
            <br />
            Tower
          </h1>
          <p>Pick a name, gather your odd little crew, and see how high you can climb.</p>
        </div>
      </div>

      <section className="auth-card" aria-labelledby="auth-title">
        <span className="auth-card-tape" aria-hidden="true" />
        <div className="auth-step">Your adventure pass</div>
        <h2>What should we call you?</h2>
        <label className="hero-name-field">
          <span>Hero name</span>
          <input
            maxLength={20}
            autoComplete="nickname"
            value={displayName}
            aria-describedby="hero-name-help"
            onChange={(event) => setDisplayName(event.target.value)}
          />
          <small id="hero-name-help">This is the name your party will use inside the tower.</small>
        </label>

        {error && (
          <p className="persistent-error" role="alert">
            {error}
          </p>
        )}

        <button
          className="google-action"
          disabled={busy || nameMissing}
          onClick={() => void google()}
        >
          <svg className="google-mark" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.6h3.3c1.9-1.8 2.9-4.4 2.9-7.5Z"
            />
            <path
              fill="currentColor"
              d="M12 22c2.7 0 5-.9 6.7-2.3l-3.3-2.6c-.9.6-2.1 1-3.4 1a5.9 5.9 0 0 1-5.5-4.1H3.1v2.7A10 10 0 0 0 12 22Z"
              opacity=".72"
            />
            <path
              fill="currentColor"
              d="M6.5 14a6 6 0 0 1 0-3.9V7.4H3.1a10 10 0 0 0 0 9.3L6.5 14Z"
              opacity=".48"
            />
            <path
              fill="currentColor"
              d="M12 6c1.5 0 2.8.5 3.9 1.5l2.9-2.9A9.8 9.8 0 0 0 3.1 7.4l3.4 2.7A5.9 5.9 0 0 1 12 6Z"
              opacity=".9"
            />
          </svg>
          <span>{busy ? 'Opening Google…' : 'Continue with Google'}</span>
        </button>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <button
          className="guest-action"
          disabled={busy || nameMissing}
          onClick={() => void guest()}
        >
          <span>Play as guest</span>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m9 6 6 6-6 6M4 12h11" />
          </svg>
        </button>

        <p className="guest-note">
          Guest progress stays on this browser. Google keeps your heroes safe across devices.
        </p>
      </section>
    </main>
  );
}
