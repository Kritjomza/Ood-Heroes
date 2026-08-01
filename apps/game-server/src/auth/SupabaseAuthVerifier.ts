import {
  createRemoteJWKSet,
  customFetch,
  decodeProtectedHeader,
  errors as joseErrors,
  jwtVerify,
  type JWTPayload,
} from 'jose';
import type { AuthenticatedIdentity, AuthVerifier } from './AuthVerifier.js';
import { AuthenticationError } from './AuthVerifier.js';

export type SupabaseAuthConfig = {
  url: string;
  publishableKey: string;
  secretKey: string;
  issuer: string;
};

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

export class SupabaseAuthVerifier implements AuthVerifier {
  readonly #config: SupabaseAuthConfig;
  readonly #fetch: FetchLike;
  readonly #jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor(config: SupabaseAuthConfig, fetcher: FetchLike = fetch) {
    this.#config = config;
    this.#fetch = fetcher;
    this.#jwks = createRemoteJWKSet(
      new URL(`${config.url.replace(/\/$/u, '')}/auth/v1/.well-known/jwks.json`),
      { cooldownDuration: 30_000, cacheMaxAge: 600_000, [customFetch]: fetcher },
    );
  }

  async verifyAccessToken(token: string): Promise<AuthenticatedIdentity> {
    if (token.trim() === '') throw new AuthenticationError('AUTH_REQUIRED');
    if (usesAsymmetricSupabaseAlgorithm(token)) {
      try {
        const verified = await jwtVerify(token, this.#jwks, {
          issuer: this.#config.issuer,
          audience: 'authenticated',
          algorithms: ['ES256', 'RS256'],
        });
        return identityFromClaims(verified.payload);
      } catch (error) {
        if (error instanceof joseErrors.JWTExpired) throw new AuthenticationError('AUTH_EXPIRED');
        throw new AuthenticationError('AUTH_INVALID');
      }
    }
    return this.#verifyThroughAuthUser(token);
  }

  async #verifyThroughAuthUser(token: string): Promise<AuthenticatedIdentity> {
    let response: Response;
    try {
      response = await this.#fetch(`${this.#config.url.replace(/\/$/u, '')}/auth/v1/user`, {
        headers: {
          apikey: this.#config.publishableKey,
          authorization: `Bearer ${token}`,
        },
      });
    } catch {
      throw new AuthenticationError('AUTH_INVALID');
    }
    if (!(response instanceof Response) || !response.ok) {
      if (!(response instanceof Response)) throw new AuthenticationError('AUTH_INVALID');
      const body = await response.text().catch(() => '');
      throw new AuthenticationError(/expir/iu.test(body) ? 'AUTH_EXPIRED' : 'AUTH_INVALID');
    }
    const user = (await response.json()) as {
      id?: unknown;
      is_anonymous?: unknown;
      email?: unknown;
    };
    if (typeof user.id !== 'string' || !UUID_PATTERN.test(user.id))
      throw new AuthenticationError('AUTH_INVALID');
    return {
      userId: user.id,
      accountKind: user.is_anonymous === true ? 'guest' : 'permanent',
      email: typeof user.email === 'string' ? user.email : null,
    };
  }
}

function usesAsymmetricSupabaseAlgorithm(token: string) {
  if (token.split('.').length !== 3) return false;
  try {
    const algorithm = decodeProtectedHeader(token).alg;
    return algorithm === 'ES256' || algorithm === 'RS256';
  } catch {
    return false;
  }
}

function identityFromClaims(claims: JWTPayload): AuthenticatedIdentity {
  if (typeof claims.sub !== 'string' || !UUID_PATTERN.test(claims.sub))
    throw new AuthenticationError('AUTH_INVALID');
  const metadata =
    typeof claims.user_metadata === 'object' && claims.user_metadata !== null
      ? (claims.user_metadata as Record<string, unknown>)
      : {};
  return {
    userId: claims.sub,
    accountKind: claims.is_anonymous === true ? 'guest' : 'permanent',
    email:
      typeof claims.email === 'string'
        ? claims.email
        : typeof metadata.email === 'string'
          ? metadata.email
          : null,
  };
}
