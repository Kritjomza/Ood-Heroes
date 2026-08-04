import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@odd-tower/network-protocol';
import type { PrivateInstance, PrivateInstanceKind, PrivateInstanceStatus } from '../instances/PrivateInstanceRegistry.js';

export interface MmoInstanceRepository {
  load(instanceId: string): Promise<PrivateInstance | null>;
  save(instance: PrivateInstance): Promise<void>;
}

export class SupabaseMmoInstanceRepository implements MmoInstanceRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async load(instanceId: string): Promise<PrivateInstance | null> {
    const [instance, members] = await Promise.all([
      this.client.from('mmo_private_instances').select('instance_id, kind, leader_account_id, status, checkpoint_revision, checkpoint_payload, revive_tokens, world_revision').eq('instance_id', instanceId).maybeSingle(),
      this.client.from('mmo_instance_members').select('instance_id, account_id').eq('instance_id', instanceId),
    ]);
    if (instance.error) throw instance.error;
    if (members.error) throw members.error;
    if (!instance.data) return null;
    const payload = isRecord(instance.data.checkpoint_payload) ? instance.data.checkpoint_payload : {};
    const reviveTokens = isRecord(payload.__reviveTokens) ? mapNumbers(payload.__reviveTokens) : {};
    return {
      instanceId: instance.data.instance_id,
      kind: parseKind(instance.data.kind),
      leaderAccountId: instance.data.leader_account_id,
      memberAccountIds: members.data.map((member) => member.account_id),
      readyAccountIds: [],
      status: parseStatus(instance.data.status),
      seed: 0,
      checkpointRevision: instance.data.checkpoint_revision,
      checkpointPayload: payload,
      reviveTokens,
    };
  }

  async save(instance: PrivateInstance): Promise<void> {
    const payload: Record<string, Json | undefined> = {
      ...instance.checkpointPayload,
      __reviveTokens: instance.reviveTokens,
    };
    const { error } = await this.client.from('mmo_private_instances').upsert({
      instance_id: instance.instanceId,
      kind: instance.kind,
      leader_account_id: instance.leaderAccountId,
      status: instance.status,
      checkpoint_revision: instance.checkpointRevision,
      checkpoint_payload: payload as Json,
      revive_tokens: Object.values(instance.reviveTokens).reduce((sum, tokens) => sum + tokens, 0),
      world_revision: instance.checkpointRevision,
    });
    if (error) throw error;
    const { error: memberError } = await this.client.from('mmo_instance_members').upsert(
      instance.memberAccountIds.map((accountId) => ({ instance_id: instance.instanceId, account_id: accountId })),
    );
    if (memberError) throw memberError;
  }
}

function parseKind(value: string): PrivateInstanceKind {
  if (value === 'story' || value === 'dungeon') return value;
  throw new Error('invalid_instance_kind');
}

function parseStatus(value: string): PrivateInstanceStatus {
  if (value === 'forming' || value === 'active' || value === 'recovering' || value === 'completed' || value === 'failed') return value;
  throw new Error('invalid_instance_status');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mapNumbers(value: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(value).filter(([, amount]) => typeof amount === 'number' && Number.isSafeInteger(amount) && amount >= 0)) as Record<string, number>;
}
