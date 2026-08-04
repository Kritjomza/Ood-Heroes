import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@odd-tower/network-protocol';
import type { PendingReward } from '../rewards/RewardLedger.js';

type RewardStatus = PendingReward['status'];
type RewardEntry = PendingReward;

export interface MmoRewardRepository {
  prepare(entry: RewardEntry): Promise<RewardEntry>;
  commit(rewardIdentity: string, committedAtMs: number): Promise<RewardEntry>;
}

export class SupabaseMmoRewardRepository implements MmoRewardRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async prepare(entry: RewardEntry): Promise<RewardEntry> {
    const valid = parseEntry(entry);
    const { data, error } = await this.client.rpc('prepare_mmo_reward', {
      p_reward_identity: valid.rewardIdentity,
      p_account_id: valid.accountId,
      p_payload: valid.payload as Json,
      p_prepared_at: new Date(valid.createdAtMs).toISOString(),
    });
    if (error) throw error;
    return parseRow(data);
  }

  async commit(rewardIdentity: string, committedAtMs: number): Promise<RewardEntry> {
    const identity = boundedString(rewardIdentity, 256);
    if (!Number.isSafeInteger(committedAtMs) || committedAtMs < 0) invalid();
    const { data, error } = await this.client.rpc('commit_mmo_reward', {
      p_reward_identity: identity,
      p_committed_at: new Date(committedAtMs).toISOString(),
    });
    if (error) throw error;
    return parseRow(data);
  }
}

function parseRow(value: unknown): RewardEntry {
  if (!isRecord(value)) invalid();
  return {
    rewardIdentity: boundedString(value.reward_identity, 256),
    accountId: boundedString(value.account_id, 128),
    status: parseStatus(value.status),
    payload: isRecord(value.payload) ? value.payload : invalid(),
    createdAtMs: parseTimestamp(value.prepared_at),
    committedAtMs: value.committed_at === null || value.committed_at === undefined ? null : parseTimestamp(value.committed_at),
  };
}

function parseEntry(value: unknown): RewardEntry {
  if (!isRecord(value) || !isRecord(value.payload)) invalid();
  const entry: RewardEntry = {
    rewardIdentity: boundedString(value.rewardIdentity, 256),
    accountId: boundedString(value.accountId, 128),
    status: parseStatus(value.status),
    payload: value.payload,
    createdAtMs: value.createdAtMs as number,
    committedAtMs: value.committedAtMs as number | null,
  };
  if (!Number.isSafeInteger(entry.createdAtMs) || entry.createdAtMs < 0) invalid();
  return entry;
}

function parseStatus(value: unknown): RewardStatus {
  if (value === 'pending' || value === 'committed') return value;
  invalid();
}

function parseTimestamp(value: unknown): number {
  if (typeof value !== 'string') invalid();
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) invalid();
  return parsed;
}

function boundedString(value: unknown, max: number): string {
  if (typeof value !== 'string' || value.length < 1 || value.length > max) invalid();
  return value;
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function invalid(): never {
  throw new Error('invalid_mmo_reward');
}
