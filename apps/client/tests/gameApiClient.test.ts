import { describe, expect, it, vi } from 'vitest';
import { GameApiClient } from '../src/persistence/game-api-client';

describe('GameApiClient', () => {
  it('attaches only the session token and unwraps authoritative data', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { ok: true }, requestId: 'request-a' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const api = new GameApiClient('http://game.test', async () => 'access-token', fetcher);
    await expect(
      api.mutate('/api/player/team', {
        idempotencyKey: '20000000-0000-4000-8000-000000000001',
        payload: { heroIds: [] },
      }),
    ).resolves.toEqual({ ok: true });
    expect(fetcher).toHaveBeenCalledWith(
      'http://game.test/api/player/team',
      expect.objectContaining({
        headers: {
          authorization: 'Bearer access-token',
          'content-type': 'application/json',
        },
      }),
    );
  });
});
