export type PrivateInstanceKind = 'story' | 'dungeon';
export type PrivateInstanceStatus = 'forming' | 'active' | 'recovering' | 'completed' | 'failed';

export type PrivateInstance = {
  instanceId: string;
  kind: PrivateInstanceKind;
  leaderAccountId: string;
  memberAccountIds: string[];
  readyAccountIds: string[];
  status: PrivateInstanceStatus;
  seed: number;
  checkpointRevision: number;
  checkpointPayload: Readonly<Record<string, unknown>>;
  reviveTokens: Record<string, number>;
};

export class PrivateInstanceRegistry {
  private readonly instances = new Map<string, PrivateInstance>();

  constructor(private readonly createInstanceId: () => string) {}

  create(kind: PrivateInstanceKind, leaderAccountId: string, seed: number, reviveTokens = 0) {
    if (!Number.isSafeInteger(seed)) throw new Error('invalid_instance_seed');
    const instance: PrivateInstance = {
      instanceId: this.createInstanceId(),
      kind,
      leaderAccountId,
      memberAccountIds: [leaderAccountId],
      readyAccountIds: [],
      status: 'forming',
      seed,
      checkpointRevision: 0,
      checkpointPayload: {},
      reviveTokens: { [leaderAccountId]: kind === 'dungeon' ? Math.max(0, Math.floor(reviveTokens)) : 0 },
    };
    this.instances.set(instance.instanceId, instance);
    return clone(instance);
  }

  addMember(instanceId: string, accountId: string) {
    const instance = this.require(instanceId);
    if (instance.status !== 'forming') throw new Error('instance_not_forming');
    if (instance.memberAccountIds.length >= 4) throw new Error('instance_party_full');
    if (!instance.memberAccountIds.includes(accountId)) {
      instance.memberAccountIds.push(accountId);
      instance.reviveTokens[accountId] = instance.kind === 'dungeon' ? 1 : 0;
    }
    return clone(instance);
  }

  setReady(instanceId: string, accountId: string, ready: boolean) {
    const instance = this.require(instanceId);
    if (!instance.memberAccountIds.includes(accountId)) throw new Error('instance_member_required');
    instance.readyAccountIds = ready
      ? [...new Set([...instance.readyAccountIds, accountId])]
      : instance.readyAccountIds.filter((id) => id !== accountId);
    if (instance.status === 'forming' && instance.readyAccountIds.length === instance.memberAccountIds.length)
      instance.status = 'active';
    return clone(instance);
  }

  checkpoint(instanceId: string, revision: number, payload: Record<string, unknown>) {
    const instance = this.require(instanceId);
    if (!Number.isSafeInteger(revision) || revision < 0) throw new Error('invalid_checkpoint_revision');
    if (revision <= instance.checkpointRevision) return clone(instance);
    instance.checkpointRevision = revision;
    instance.checkpointPayload = { ...payload };
    return clone(instance);
  }

  disconnect(instanceId: string) {
    const instance = this.require(instanceId);
    if (instance.status === 'active') instance.status = 'recovering';
    return clone(instance);
  }

  reconnect(instanceId: string) {
    const instance = this.require(instanceId);
    if (instance.status === 'recovering') instance.status = 'active';
    return clone(instance);
  }

  consumeReviveToken(instanceId: string, accountId: string) {
    const instance = this.require(instanceId);
    if (instance.kind !== 'dungeon') throw new Error('revive_tokens_not_allowed');
    const remaining = instance.reviveTokens[accountId] ?? 0;
    if (remaining < 1) return false;
    instance.reviveTokens[accountId] = remaining - 1;
    return true;
  }

  complete(instanceId: string) {
    const instance = this.require(instanceId);
    instance.status = 'completed';
    return clone(instance);
  }

  get(instanceId: string) {
    const instance = this.instances.get(instanceId);
    return instance ? clone(instance) : undefined;
  }

  hydrate(instance: PrivateInstance) {
    if (this.instances.has(instance.instanceId)) return clone(this.instances.get(instance.instanceId)!);
    this.instances.set(instance.instanceId, clone(instance));
    return clone(instance);
  }

  private require(instanceId: string) {
    const instance = this.instances.get(instanceId);
    if (!instance) throw new Error('instance_not_found');
    return instance;
  }
}

function clone(instance: PrivateInstance): PrivateInstance {
  return {
    ...instance,
    memberAccountIds: [...instance.memberAccountIds],
    readyAccountIds: [...instance.readyAccountIds],
    checkpointPayload: { ...instance.checkpointPayload },
    reviveTokens: { ...instance.reviveTokens },
  };
}
