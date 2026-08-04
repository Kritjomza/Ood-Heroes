import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@odd-tower/network-protocol';

export type WorldCheckpoint = {
  accountId: string;
  zoneId: string;
  sanctuaryId: string;
  channelHint: string | null;
  revision: number;
  checkpointedAt: string;
  payload: Record<string, Json | undefined>;
};

export interface WorldCheckpointRepository {
  load(accountId: string): Promise<WorldCheckpoint | null>;
  saveIfNewer(checkpoint: WorldCheckpoint): Promise<'saved' | 'stale'>;
}

export class SupabaseWorldCheckpointRepository implements WorldCheckpointRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async load(accountId: string): Promise<WorldCheckpoint | null> {
    const { data, error } = await this.client
      .from('mmo_world_checkpoints')
      .select(
        'account_id, zone_id, sanctuary_id, channel_hint, revision, checkpointed_at, payload',
      )
      .eq('account_id', accountId)
      .maybeSingle();
    if (error) throw error;
    return data === null ? null : parseCheckpointRow(data);
  }

  async saveIfNewer(checkpoint: WorldCheckpoint): Promise<'saved' | 'stale'> {
    const valid = parseCheckpoint(checkpoint);
    const { data, error } = await this.client.rpc('save_mmo_world_checkpoint', {
      p_account_id: valid.accountId,
      p_zone_id: valid.zoneId,
      p_sanctuary_id: valid.sanctuaryId,
      p_channel_hint: valid.channelHint,
      p_revision: valid.revision,
      p_checkpointed_at: valid.checkpointedAt,
      p_payload: valid.payload,
    });
    if (error) throw error;
    return data ? 'saved' : 'stale';
  }
}

function parseCheckpointRow(value: unknown): WorldCheckpoint {
  if (!isRecord(value)) invalid();
  return parseCheckpoint({
    accountId: value.account_id,
    zoneId: value.zone_id,
    sanctuaryId: value.sanctuary_id,
    channelHint: value.channel_hint,
    revision: value.revision,
    checkpointedAt: value.checkpointed_at,
    payload: value.payload,
  });
}

function parseCheckpoint(value: unknown): WorldCheckpoint {
  if (!isRecord(value)) invalid();
  const accountId = boundedString(value.accountId);
  const zoneId = boundedString(value.zoneId);
  const sanctuaryId = boundedString(value.sanctuaryId);
  const channelHint = value.channelHint === null ? null : boundedString(value.channelHint);
  if (typeof value.revision !== 'number' || !Number.isSafeInteger(value.revision) || value.revision < 0)
    invalid();
  if (
    typeof value.checkpointedAt !== 'string' ||
    !Number.isFinite(Date.parse(value.checkpointedAt)) ||
    new Date(value.checkpointedAt).toISOString() !== value.checkpointedAt
  )
    invalid();
  if (!isRecord(value.payload)) invalid();
  return {
    accountId,
    zoneId,
    sanctuaryId,
    channelHint,
    revision: value.revision,
    checkpointedAt: value.checkpointedAt,
    payload: value.payload as Record<string, Json | undefined>,
  };
}

function boundedString(value: unknown): string {
  if (typeof value !== 'string' || value.length < 1 || value.length > 64) invalid();
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function invalid(): never {
  throw new Error('invalid_world_checkpoint');
}
