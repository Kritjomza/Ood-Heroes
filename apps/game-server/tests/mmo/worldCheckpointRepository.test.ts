import { describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@odd-tower/network-protocol';
import { SupabaseWorldCheckpointRepository } from '../../src/mmo/persistence/WorldCheckpointRepository';

describe('Supabase world checkpoint repository', () => {
  it('maps an owned checkpoint row into the runtime shape', async () => {
    const client = checkpointClient({
      row: {
        account_id: 'account-1',
        zone_id: 'floor-1',
        sanctuary_id: 'central-camp',
        channel_hint: 'channel-7',
        revision: 19,
        checkpointed_at: '2026-08-04T12:00:00.000Z',
        payload: { x: 12, y: 24 },
      },
    });
    const repository = new SupabaseWorldCheckpointRepository(client);

    await expect(repository.load('account-1')).resolves.toEqual({
      accountId: 'account-1',
      zoneId: 'floor-1',
      sanctuaryId: 'central-camp',
      channelHint: 'channel-7',
      revision: 19,
      checkpointedAt: '2026-08-04T12:00:00.000Z',
      payload: { x: 12, y: 24 },
    });
  });

  it('returns null when no durable checkpoint exists', async () => {
    const repository = new SupabaseWorldCheckpointRepository(checkpointClient({ row: null }));

    await expect(repository.load('account-1')).resolves.toBeNull();
  });

  it('maps the atomic RPC result to saved or stale', async () => {
    const checkpoint = {
      accountId: 'account-1',
      zoneId: 'floor-1',
      sanctuaryId: 'central-camp',
      channelHint: null,
      revision: 20,
      checkpointedAt: '2026-08-04T12:01:00.000Z',
      payload: { x: 14, y: 25 },
    };

    await expect(
      new SupabaseWorldCheckpointRepository(checkpointClient({ rpcResult: true })).saveIfNewer(
        checkpoint,
      ),
    ).resolves.toBe('saved');
    await expect(
      new SupabaseWorldCheckpointRepository(checkpointClient({ rpcResult: false })).saveIfNewer(
        checkpoint,
      ),
    ).resolves.toBe('stale');
  });

  it('rejects malformed JSON rows instead of restoring unsafe state', async () => {
    const repository = new SupabaseWorldCheckpointRepository(
      checkpointClient({
        row: {
          account_id: 'account-1',
          zone_id: '',
          sanctuary_id: 'central-camp',
          channel_hint: null,
          revision: 1,
          checkpointed_at: 'not-a-date',
          payload: [],
        },
      }),
    );

    await expect(repository.load('account-1')).rejects.toThrow('invalid_world_checkpoint');
  });
});

function checkpointClient(options: { row?: unknown; rpcResult?: boolean }) {
  const query = {
    select: () => query,
    eq: () => query,
    maybeSingle: async () => ({ data: options.row ?? null, error: null }),
  };
  return {
    from: () => query,
    rpc: async () => ({ data: options.rpcResult ?? false, error: null }),
  } as unknown as SupabaseClient<Database>;
}
