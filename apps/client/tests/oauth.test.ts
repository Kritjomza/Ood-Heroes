import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createOAuthCoordinator,
  oauthCallbackUrl,
  readLinkIntent,
  writeLinkIntent,
} from '../src/persistence/oauth';

const auth = {
  signInWithOAuth: vi.fn(),
  linkIdentity: vi.fn(),
};

describe('Google OAuth coordinator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('builds callbacks from an allowed application origin', () => {
    expect(oauthCallbackUrl('http://127.0.0.1:4173', 'signin')).toBe(
      'http://127.0.0.1:4173/auth/callback',
    );
    expect(oauthCallbackUrl('https://game.example.com/', 'link')).toBe(
      'https://game.example.com/auth/link-callback',
    );
  });

  it('rejects unsafe or non-origin base URLs', () => {
    expect(() => oauthCallbackUrl('javascript:alert(1)', 'signin')).toThrow('invalid');
    expect(() => oauthCallbackUrl('https://game.example.com/path', 'signin')).toThrow('invalid');
  });

  it('starts Google sign-in once with no unrelated scopes', async () => {
    auth.signInWithOAuth.mockResolvedValue({ error: null });
    const coordinator = createOAuthCoordinator(auth, 'http://127.0.0.1:4173');
    await Promise.all([coordinator.signInWithGoogle(), coordinator.signInWithGoogle()]);
    expect(auth.signInWithOAuth).toHaveBeenCalledTimes(1);
    expect(auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: 'http://127.0.0.1:4173/auth/callback' },
    });
  });

  it('stores and consumes a short-lived token-free Guest link intent', () => {
    writeLinkIntent('10000000-0000-4000-8000-000000000001', 1_000);
    expect(sessionStorage.getItem('odd-tower:oauth-link')).not.toContain('token');
    expect(readLinkIntent(1_001)?.userId).toBe('10000000-0000-4000-8000-000000000001');
    expect(readLinkIntent(1_000 + 10 * 60_000)).toBeNull();
  });

  it('links an anonymous Guest without ordinary sign-in', async () => {
    auth.linkIdentity.mockResolvedValue({ error: null });
    const coordinator = createOAuthCoordinator(auth, 'http://127.0.0.1:4173');
    await coordinator.protectGuestWithGoogle({
      id: '10000000-0000-4000-8000-000000000001',
      is_anonymous: true,
    });
    expect(auth.linkIdentity).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: 'http://127.0.0.1:4173/auth/link-callback' },
    });
    expect(auth.signInWithOAuth).not.toHaveBeenCalled();
  });
});
