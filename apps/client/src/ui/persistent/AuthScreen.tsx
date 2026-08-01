import { useState } from 'react';
import { getAuthClient } from '../../persistence/auth-client';
import { createOAuthCoordinator } from '../../persistence/oauth';

export function AuthScreen() {
  const [mode, setMode] = useState<'create' | 'signin'>('signin');
  const [displayName, setDisplayName] = useState('Odd Hero');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (operation: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await operation();
    } catch {
      setError('Authentication could not be completed. Please try again.');
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
        options: { data: { display_name: displayName } },
      });
      if (error) throw error;
    });
  const emailAuth = () =>
    run(async () => {
      const auth = getAuthClient().auth;
      const result =
        mode === 'create'
          ? await auth.signUp({ email, password, options: { data: { display_name: displayName } } })
          : await auth.signInWithPassword({ email, password });
      if (result.error) throw result.error;
    });
  return (
    <main className="persistent-shell auth-page">
      <section className="sticker-card auth-card" aria-labelledby="auth-title">
        <p className="persistent-eyebrow">A tiny tower. A very odd team.</p>
        <h1 id="auth-title">Odd Tower</h1>
        <div className="tower-mark" aria-hidden="true">
          🏰
        </div>
        <label>
          Hero name
          <input
            maxLength={20}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </label>
        {error && (
          <p className="persistent-error" role="alert">
            {error}
          </p>
        )}
        <button
          className="google-action"
          disabled={busy}
          onClick={() => void google()}
          aria-label="Continue with Google"
        >
          <span className="google-mark" aria-hidden="true">
            G
          </span>
          {busy ? 'Redirecting…' : 'Continue with Google'}
        </button>
        <button
          className="secondary-action guest-action"
          disabled={busy}
          onClick={() => void guest()}
        >
          Play as Guest
        </button>
        <div className="auth-divider">
          <span>or use email</span>
        </div>
        <label>
          Email
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            minLength={6}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button className="primary-action" disabled={busy} onClick={() => void emailAuth()}>
          {mode === 'create' ? 'Create Account' : 'Sign In'}
        </button>
        <div className="auth-switches">
          <button onClick={() => setMode('create')}>Create account</button>
          <button onClick={() => setMode('signin')}>Sign in</button>
        </div>
        <p className="guest-note">Guest progress stays on this browser until you protect it.</p>
      </section>
    </main>
  );
}
