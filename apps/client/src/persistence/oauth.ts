import type { User } from '@supabase/supabase-js';

export type OAuthFlowState =
  | 'idle'
  | 'redirecting-to-google'
  | 'processing-callback'
  | 'linking-google'
  | 'bootstrapping-player'
  | 'succeeded'
  | 'failed';

type OAuthAuth = {
  signInWithOAuth(options: {
    provider: 'google';
    options: { redirectTo: string };
  }): Promise<{ error: Error | null }>;
  linkIdentity(options: {
    provider: 'google';
    options: { redirectTo: string };
  }): Promise<{ error: Error | null }>;
};

const LINK_INTENT_KEY = 'odd-tower:oauth-link';
const LINK_INTENT_LIFETIME_MS = 5 * 60_000;

export type LinkIntent = { userId: string; expiresAt: number };

export function applicationBaseUrl(configured?: string): string {
  const candidate = configured?.trim() || window.location.origin;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error('OAuth application base URL is invalid.');
  }
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error('OAuth application base URL is invalid.');
  if (url.pathname !== '/' && url.pathname !== '')
    throw new Error('OAuth application base URL is invalid.');
  if (url.protocol === 'http:' && !['127.0.0.1', 'localhost'].includes(url.hostname))
    throw new Error('OAuth application base URL is invalid.');
  return url.origin;
}

export function oauthCallbackUrl(baseUrl: string | undefined, intent: 'signin' | 'link') {
  return new URL(
    intent === 'link' ? '/auth/link-callback' : '/auth/callback',
    applicationBaseUrl(baseUrl),
  ).toString();
}

export function writeLinkIntent(userId: string, now = Date.now()) {
  sessionStorage.setItem(
    LINK_INTENT_KEY,
    JSON.stringify({ userId, expiresAt: now + LINK_INTENT_LIFETIME_MS } satisfies LinkIntent),
  );
}

export function readLinkIntent(now = Date.now()): LinkIntent | null {
  const raw = sessionStorage.getItem(LINK_INTENT_KEY);
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<LinkIntent>;
    if (
      typeof value.userId !== 'string' ||
      typeof value.expiresAt !== 'number' ||
      value.expiresAt < now
    )
      throw new Error('expired');
    return { userId: value.userId, expiresAt: value.expiresAt };
  } catch {
    clearLinkIntent();
    return null;
  }
}

export function clearLinkIntent() {
  sessionStorage.removeItem(LINK_INTENT_KEY);
}

export function hasGoogleIdentity(user: Pick<User, 'identities'>) {
  return user.identities?.some((identity) => identity.provider === 'google') === true;
}

export function createOAuthCoordinator(auth: OAuthAuth, configuredBaseUrl?: string) {
  let pending = false;
  return {
    async signInWithGoogle() {
      if (pending) return;
      pending = true;
      const { error } = await auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: oauthCallbackUrl(configuredBaseUrl, 'signin') },
      });
      if (error) {
        pending = false;
        throw error;
      }
    },
    async protectGuestWithGoogle(user: Pick<User, 'id' | 'is_anonymous'>) {
      if (pending) return;
      if (user.is_anonymous !== true) throw new Error('Only a Guest can protect progress.');
      pending = true;
      writeLinkIntent(user.id);
      const { error } = await auth.linkIdentity({
        provider: 'google',
        options: { redirectTo: oauthCallbackUrl(configuredBaseUrl, 'link') },
      });
      if (error) {
        pending = false;
        clearLinkIntent();
        throw error;
      }
    },
  };
}

export function oauthErrorCopy(code: string) {
  const messages: Record<string, string> = {
    OAUTH_CANCELLED: 'Google sign-in was cancelled. Your account was not changed.',
    OAUTH_PROVIDER_ERROR: 'Google could not complete sign-in. Please try again.',
    OAUTH_CALLBACK_INVALID: 'This sign-in link is invalid or expired. Please start again.',
    AUTH_SESSION_MISSING: 'No secure session was returned. Please start again.',
    GOOGLE_IDENTITY_ALREADY_LINKED:
      'That Google account is already connected elsewhere. Your Guest progress is unchanged.',
    GOOGLE_IDENTITY_LINK_CONFLICT:
      'That Google identity cannot be linked safely. Your Guest progress is unchanged.',
    PROFILE_BOOTSTRAP_FAILED:
      'You signed in, but your tower progress could not be loaded. Please retry.',
  };
  return messages[code] ?? messages.OAUTH_PROVIDER_ERROR;
}
