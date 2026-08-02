import { useEffect, useState } from 'react';
import type { PlayerBootstrap } from '@odd-tower/network-protocol';
import { getAuthClient } from '../../persistence/auth-client';
import { createOAuthCoordinator, hasGoogleIdentity } from '../../persistence/oauth';
import { AdventureIcon } from './AdventureIcons';
import { ScreenHeading } from './CollectionScreen';

export function AccountScreen({
  player,
  back,
  onProtected,
}: {
  player: PlayerBootstrap;
  back: () => void;
  onProtected: () => Promise<void>;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [identity, setIdentity] = useState<{ email: string | null; google: boolean } | null>(null);
  useEffect(() => {
    void getAuthClient()
      .auth.getUser()
      .then(({ data }) =>
        setIdentity({
          email: data.user?.email ?? null,
          google: data.user ? hasGoogleIdentity(data.user) : false,
        }),
      );
  }, []);
  const protectEmail = async () => {
    if (busy) return;
    setBusy(true);
    const { error } = await getAuthClient().auth.updateUser({ email, password });
    if (error) {
      setMessage('Email protection could not be completed.');
      setBusy(false);
      return;
    }
    await getAuthClient().auth.refreshSession();
    await onProtected();
    setMessage('Check your email if confirmation is enabled. Your heroes are safe.');
    setBusy(false);
  };
  const protectGoogle = async () => {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const auth = getAuthClient().auth;
      const { data } = await auth.getUser();
      if (!data.user) throw new Error('missing');
      await createOAuthCoordinator(auth, import.meta.env.VITE_APP_BASE_URL).protectGuestWithGoogle(
        data.user,
      );
    } catch {
      setMessage('Google protection could not start. Your guest progress is unchanged.');
      setBusy(false);
    }
  };
  const guest = player.profile.accountKind === 'guest';
  return (
    <section className="persistent-content account-screen">
      <ScreenHeading
        title="Player passport"
        subtitle={guest ? 'Guest adventurer' : 'Protected adventurer'}
        back={back}
      />
      <div className="passport">
        <div className="passport-cover">
          <span className="passport-emblem">
            <AdventureIcon name="shield" />
          </span>
          <small>ODD TOWER ADVENTURER</small>
          <h2>{player.profile.displayName}</h2>
          <span className={`account-stamp ${guest ? 'guest' : 'protected'}`}>
            {guest ? 'Guest' : 'Protected'}
          </span>
        </div>
        <div className="passport-details">
          <div className="account-status">
            <AdventureIcon name={guest ? 'lock' : 'shield'} />
            <span>
              <strong>
                {guest ? 'This adventure lives on this browser' : 'Your adventure is protected'}
              </strong>
              <small>
                {identity?.google
                  ? 'Google connected'
                  : (identity?.email ?? 'No connected provider yet')}
              </small>
            </span>
          </div>
          {guest ? (
            <>
              <p>
                Connect Google to keep your heroes, rewards, and team available on another device.
              </p>
              <button
                className="google-action"
                disabled={busy}
                onClick={() => void protectGoogle()}
              >
                {busy ? 'Opening Google…' : 'Protect with Google'}
              </button>
              <details className="email-backup">
                <summary>Use email instead</summary>
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
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </label>
                <button
                  className="primary-action"
                  disabled={busy || !email || password.length < 6}
                  onClick={() => void protectEmail()}
                >
                  Protect with email
                </button>
              </details>
            </>
          ) : (
            <p>
              Your saved progress is attached to your account and can be restored after sign-in.
            </p>
          )}
          {message && (
            <p className="account-message" role="status">
              {message}
            </p>
          )}
          <details className="technical-details">
            <summary>Adventure record</summary>
            <dl>
              <div>
                <dt>User ID</dt>
                <dd>{player.profile.userId}</dd>
              </div>
              <div>
                <dt>Contract</dt>
                <dd>v{player.contractVersion}</dd>
              </div>
              <div>
                <dt>Save status</dt>
                <dd>{player.persistence.status}</dd>
              </div>
              <div>
                <dt>Queue</dt>
                <dd>{player.persistence.queueDepth}</dd>
              </div>
            </dl>
          </details>
          <button
            className="plastic-button sign-out"
            onClick={() => void getAuthClient().auth.signOut()}
          >
            Sign out
          </button>
        </div>
      </div>
    </section>
  );
}
