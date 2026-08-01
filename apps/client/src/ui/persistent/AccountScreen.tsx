import { useEffect, useState } from 'react';
import type { PlayerBootstrap } from '@odd-tower/network-protocol';
import { getAuthClient } from '../../persistence/auth-client';
import { createOAuthCoordinator, hasGoogleIdentity } from '../../persistence/oauth';
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
    setMessage('Check your email if confirmation is enabled. Your progress stays attached.');
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
      setMessage('Google protection could not start. Your Guest progress is unchanged.');
      setBusy(false);
    }
  };
  return (
    <section className="persistent-content">
      <ScreenHeading
        title="Account"
        subtitle={player.profile.accountKind === 'guest' ? 'Guest progress' : 'Protected account'}
        back={back}
      />
      <div className="sticker-card account-card">
        <h2>{player.profile.displayName}</h2>
        <p>
          <strong>Account type:</strong>{' '}
          {player.profile.accountKind === 'guest' ? 'Guest' : 'Permanent'}
        </p>
        {player.profile.accountKind === 'guest' ? (
          <>
            <p>
              Tie this suspicious tower adventure to your Google account. Your Heroes and rewards
              will stay exactly where they are, and you can play on another device.
            </p>
            <button className="google-action" disabled={busy} onClick={() => void protectGoogle()}>
              {busy ? 'Redirecting…' : 'Protect Progress with Google'}
            </button>
            <div className="auth-divider">
              <span>or use email</span>
            </div>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <button
              className="primary-action"
              disabled={busy}
              aria-label="Protect Progress"
              onClick={() => void protectEmail()}
            >
              Protect Progress with Email
            </button>
          </>
        ) : (
          <>
            <p>Progress is protected by your Supabase account.</p>
            <p>
              Provider: {identity?.google ? 'Google connected' : 'Email/password'}
              {identity?.email ? ` · ${identity.email}` : ''}
            </p>
          </>
        )}
        {message && <p role="status">{message}</p>}
        <button className="secondary-action" onClick={() => void getAuthClient().auth.signOut()}>
          Sign Out
        </button>
      </div>
    </section>
  );
}
