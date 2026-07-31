import { useEffect, useRef, useState } from 'react';
import { getAuthClient } from '../../persistence/auth-client';
import {
  clearLinkIntent,
  hasGoogleIdentity,
  oauthErrorCopy,
  readLinkIntent,
  type OAuthFlowState,
} from '../../persistence/oauth';

export function OAuthCallbackScreen({
  linking,
  onLinked,
  onComplete,
}: {
  linking: boolean;
  onLinked: () => Promise<void>;
  onComplete: () => void;
}) {
  const started = useRef(false);
  const [flow, setFlow] = useState<OAuthFlowState>('processing-callback');
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void (async () => {
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.has('error') || url.searchParams.has('error_code'))
          throw new Error(
            url.searchParams.get('error_code') === 'identity_already_exists'
              ? 'GOOGLE_IDENTITY_ALREADY_LINKED'
              : 'OAUTH_PROVIDER_ERROR',
          );
        const auth = getAuthClient().auth;
        const { data: sessionData, error: sessionError } = await auth.getSession();
        if (sessionError || !sessionData.session) throw new Error('AUTH_SESSION_MISSING');
        const { data: userData, error: userError } = await auth.getUser();
        if (userError || !userData.user) throw new Error('AUTH_SESSION_MISSING');
        if (linking) {
          const intent = readLinkIntent();
          if (!intent) throw new Error('OAUTH_CALLBACK_INVALID');
          if (
            userData.user.id !== intent.userId ||
            userData.user.is_anonymous ||
            !hasGoogleIdentity(userData.user)
          )
            throw new Error('GOOGLE_IDENTITY_LINK_CONFLICT');
          await auth.refreshSession();
          setFlow('bootstrapping-player');
          await onLinked();
          clearLinkIntent();
        }
        setFlow('succeeded');
        window.history.replaceState({}, '', '/');
        onComplete();
      } catch (caught) {
        setError(oauthErrorCopy(caught instanceof Error ? caught.message : 'OAUTH_PROVIDER_ERROR'));
        setFlow('failed');
      }
    })();
  }, [linking, onComplete, onLinked]);
  return (
    <main className="persistent-shell auth-page" aria-busy={flow !== 'failed'}>
      <section className="sticker-card auth-card" aria-live="polite">
        <div className="tower-mark" aria-hidden="true">
          🏰
        </div>
        <h1>
          {flow === 'failed'
            ? 'The drawbridge got stuck'
            : linking
              ? 'Protecting your progress…'
              : 'Google found your tower…'}
        </h1>
        <p>
          {error ??
            (flow === 'bootstrapping-player'
              ? 'Checking every Hero is still where you left them.'
              : 'Safely restoring your Odd Tower account.')}
        </p>
        {flow === 'failed' && (
          <button
            className="primary-action"
            onClick={() => {
              clearLinkIntent();
              window.history.replaceState({}, '', '/');
              onComplete();
            }}
          >
            Back to Login
          </button>
        )}
      </section>
    </main>
  );
}
