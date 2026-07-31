import {
  validatePlayerBootstrap,
  type MutationEnvelope,
  type PlayerBootstrap,
} from '@odd-tower/network-protocol';
import { GameApiError } from './persistence-errors';

type TokenProvider = () => Promise<string | null>;

export class GameApiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly tokenProvider: TokenProvider,
    private readonly fetcher: typeof fetch = fetch.bind(globalThis),
  ) {}

  async initialize(displayName: string, signal?: AbortSignal) {
    return this.#bootstrap('/api/player/bootstrap', {
      method: 'POST',
      body: JSON.stringify({ displayName }),
      signal,
    });
  }

  async bootstrap(signal?: AbortSignal) {
    return this.#bootstrap('/api/player/bootstrap', { method: 'GET', signal });
  }

  async mutate<T>(
    path: string,
    envelope: MutationEnvelope,
    method: 'POST' | 'PUT' | 'PATCH' = 'POST',
    signal?: AbortSignal,
  ): Promise<T> {
    return this.#request<T>(path, {
      method,
      body: JSON.stringify(envelope),
      signal,
    });
  }

  async #bootstrap(path: string, init: RequestInit): Promise<PlayerBootstrap> {
    const value = await this.#request<unknown>(path, init);
    const validated = validatePlayerBootstrap(value);
    if (!validated.ok) throw new GameApiError(validated.code, 'unknown', 'Invalid server data.');
    return validated.value;
  }

  async #request<T>(path: string, init: RequestInit): Promise<T> {
    const token = await this.tokenProvider();
    if (!token) throw new GameApiError('AUTH_REQUIRED', 'client', 'Please sign in.');
    const response = await this.fetcher(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
    });
    const body = (await response.json()) as {
      data?: T;
      requestId?: string;
      error?: { code?: string; message?: string; requestId?: string };
    };
    if (!response.ok || body.error) {
      throw new GameApiError(
        (body.error?.code ?? 'SERVER_ERROR') as GameApiError['code'],
        body.error?.requestId ?? body.requestId ?? 'unknown',
        body.error?.message ?? 'Request failed.',
      );
    }
    return body.data as T;
  }
}
