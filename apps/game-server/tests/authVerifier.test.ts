// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { SupabaseAuthVerifier } from '../src/auth/SupabaseAuthVerifier';

const config = {
  url: 'http://127.0.0.1:54321',
  publishableKey: 'publishable-test-value',
  secretKey: 'secret-test-value',
  issuer: 'http://127.0.0.1:54321/auth/v1',
};

async function es256Fixture(overrides: Record<string, unknown> = {}) {
  const { privateKey, publicKey } = await generateKeyPair('ES256');
  const jwk = { ...(await exportJWK(publicKey)), kid: 'cloud-key', alg: 'ES256', use: 'sig' };
  const now = Math.floor(Date.now() / 1000);
  const token = await new SignJWT({
    sub: '10000000-0000-4000-8000-000000000001',
    role: 'authenticated',
    email: 'hero@example.test',
    iss: config.issuer,
    aud: 'authenticated',
    iat: now,
    exp: now + 300,
    ...overrides,
  })
    .setProtectedHeader({ alg: 'ES256', kid: 'cloud-key', typ: 'JWT' })
    .sign(privateKey);
  const request = vi.fn(async (input: string) => {
    if (input.endsWith('/.well-known/jwks.json'))
      return new Response(JSON.stringify({ keys: [jwk] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    return new Response('{}', { status: 401 });
  });
  return { token, request };
}

describe('SupabaseAuthVerifier', () => {
  it('accepts a valid Supabase Cloud ES256 access token through JWKS', async () => {
    const { token, request } = await es256Fixture();
    const verifier = new SupabaseAuthVerifier(config, request);
    await expect(verifier.verifyAccessToken(token)).resolves.toEqual({
      userId: '10000000-0000-4000-8000-000000000001',
      accountKind: 'permanent',
      email: 'hero@example.test',
    });
  });

  it('rejects an ES256 token with an invalid signature', async () => {
    const trusted = await es256Fixture();
    const untrusted = await es256Fixture();
    const verifier = new SupabaseAuthVerifier(config, trusted.request);
    await expect(verifier.verifyAccessToken(untrusted.token)).rejects.toMatchObject({
      code: 'AUTH_INVALID',
    });
  });

  it('rejects an ES256 token with the wrong issuer', async () => {
    const { token, request } = await es256Fixture({ iss: 'https://wrong.example/auth/v1' });
    const verifier = new SupabaseAuthVerifier(config, request);
    await expect(verifier.verifyAccessToken(token)).rejects.toMatchObject({ code: 'AUTH_INVALID' });
  });

  it('rejects an ES256 token with the wrong audience', async () => {
    const { token, request } = await es256Fixture({ aud: 'anon' });
    const verifier = new SupabaseAuthVerifier(config, request);
    await expect(verifier.verifyAccessToken(token)).rejects.toMatchObject({ code: 'AUTH_INVALID' });
  });

  it('rejects an expired ES256 token as expired', async () => {
    const { token, request } = await es256Fixture({ exp: Math.floor(Date.now() / 1000) - 60 });
    const verifier = new SupabaseAuthVerifier(config, request);
    await expect(verifier.verifyAccessToken(token)).rejects.toMatchObject({ code: 'AUTH_EXPIRED' });
  });

  it('rejects missing and malformed tokens without echoing them', async () => {
    const verifier = new SupabaseAuthVerifier(config, vi.fn());
    await expect(verifier.verifyAccessToken('')).rejects.toMatchObject({ code: 'AUTH_REQUIRED' });
    const token = 'sensitive.bad.token';
    const error = await verifier.verifyAccessToken(token).catch((caught: unknown) => caught);
    expect(error).toMatchObject({ code: 'AUTH_INVALID' });
    expect(String(error)).not.toContain(token);
  });

  it('uses the supported Auth user endpoint fallback and extracts stable identity', async () => {
    const request = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: '10000000-0000-0000-0000-000000000001',
          is_anonymous: true,
          email: null,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );
    const verifier = new SupabaseAuthVerifier(config, request);
    await expect(verifier.verifyAccessToken('opaque-local-token')).resolves.toEqual({
      userId: '10000000-0000-0000-0000-000000000001',
      accountKind: 'guest',
      email: null,
    });
    expect(request).toHaveBeenCalledWith(
      'http://127.0.0.1:54321/auth/v1/user',
      expect.objectContaining({
        headers: {
          apikey: 'publishable-test-value',
          authorization: 'Bearer opaque-local-token',
        },
      }),
    );
  });

  it('maps rejected and expired Auth responses to stable codes', async () => {
    const expired = new SupabaseAuthVerifier(
      config,
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ msg: 'token is expired' }), { status: 401 }),
        ),
    );
    await expect(expired.verifyAccessToken('opaque')).rejects.toMatchObject({
      code: 'AUTH_EXPIRED',
    });
    const invalid = new SupabaseAuthVerifier(
      config,
      vi.fn().mockResolvedValue(new Response('{}', { status: 403 })),
    );
    await expect(invalid.verifyAccessToken('opaque')).rejects.toMatchObject({
      code: 'AUTH_INVALID',
    });
  });

  it('accepts a Google-authenticated Supabase user without trusting provider metadata', async () => {
    const request = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: '10000000-0000-0000-0000-000000000009',
          is_anonymous: false,
          email: 'hero@example.test',
          app_metadata: { provider: 'google', providers: ['google'] },
          user_metadata: {
            provider_id: 'untrusted-google-id',
            avatar_url: 'https://example.test/a.png',
          },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );
    const verifier = new SupabaseAuthVerifier(config, request);
    await expect(verifier.verifyAccessToken('opaque-google-session')).resolves.toEqual({
      userId: '10000000-0000-0000-0000-000000000009',
      accountKind: 'permanent',
      email: 'hero@example.test',
    });
  });
});
