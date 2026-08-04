import { ChannelRegistry } from '../channels/ChannelRegistry.js';

export type AssignmentRequest = {
  accountId: string;
  zoneId: string;
  region: string;
  partyAccountIds?: readonly string[];
  friendChannelId?: string;
  nowMs: number;
};

export type AssignmentResult = {
  channelId: string;
  leaseId: string;
  expiresAtMs: number;
  reason: 'assigned' | 'friend' | 'reconnect';
};

export type ChannelTransfer = {
  transferId: string;
  accountId: string;
  channelId: string;
  leaseId: string;
  state: 'reserved' | 'committed' | 'rolled-back';
};

type Lease = Omit<AssignmentResult, 'reason'> & { accountId: string };

type WorldDirectoryOptions = {
  channels: ChannelRegistry;
  createLeaseId: () => string;
  leaseDurationMs: number;
  createTransferId?: () => string;
};

export class WorldDirectory {
  private readonly leases = new Map<string, Lease>();
  private readonly transfers = new Map<string, { accountIds: string[]; oldChannelId: string; newChannelId: string; leases: Lease[]; state: ChannelTransfer['state'] }>();

  constructor(private readonly options: WorldDirectoryOptions) {
    if (!Number.isFinite(options.leaseDurationMs) || options.leaseDurationMs <= 0)
      throw new Error('invalid_lease_duration');
  }

  assign(request: AssignmentRequest): AssignmentResult {
    const accountIds = uniqueParty(request.accountId, request.partyAccountIds);
    this.expireLeases(accountIds, request.nowMs);

    const live = accountIds.map((accountId) => this.leases.get(accountId)).filter(Boolean) as Lease[];
    if (live.length === accountIds.length) {
      const channelIds = new Set(live.map((lease) => lease.channelId));
      if (channelIds.size === 1) return asResult(live.find((lease) => lease.accountId === request.accountId)!, 'reconnect');
    }
    if (live.length > 0) throw new Error('party_lease_conflict');

    let channelId: string;
    let reason: AssignmentResult['reason'] = 'assigned';
    const friend = request.friendChannelId
      ? this.options.channels.get(request.friendChannelId)
      : undefined;
    if (
      friend &&
      friend.zoneId === request.zoneId &&
      friend.region === request.region &&
      friend.status === 'healthy' &&
      friend.population + accountIds.length <= friend.capacity
    ) {
      channelId = this.options.channels.reserve(friend.channelId, accountIds.length).channelId;
      reason = 'friend';
    } else {
      channelId = this.options.channels.assign(request.zoneId, request.region, accountIds.length).channelId;
    }

    const expiresAtMs = request.nowMs + this.options.leaseDurationMs;
    let leader: Lease | undefined;
    for (const accountId of accountIds) {
      const lease: Lease = {
        accountId,
        channelId,
        leaseId: this.options.createLeaseId(),
        expiresAtMs,
      };
      this.leases.set(accountId, lease);
      if (accountId === request.accountId) leader = lease;
    }
    return asResult(leader!, reason);
  }

  activeLeaseCount(accountId: string): number {
    return this.leases.has(accountId) ? 1 : 0;
  }

  release(accountId: string, leaseId: string): boolean {
    const lease = this.leases.get(accountId);
    if (!lease || lease.leaseId !== leaseId) return false;
    this.leases.delete(accountId);
    this.options.channels.release(lease.channelId, 1);
    return true;
  }

  prepareTransfer(request: AssignmentRequest): ChannelTransfer {
    const accountIds = uniqueParty(request.accountId, request.partyAccountIds);
    const current = accountIds.map((accountId) => this.leases.get(accountId));
    if (current.some((lease) => !lease)) throw new Error('transfer_lease_required');
    const oldChannelId = current[0]!.channelId;
    if (current.some((lease) => lease!.channelId !== oldChannelId)) throw new Error('party_lease_conflict');
    const target = request.friendChannelId && request.friendChannelId !== oldChannelId && this.options.channels.get(request.friendChannelId)
      ? this.options.channels.reserve(request.friendChannelId, accountIds.length)
      : this.options.channels.assign(request.zoneId, request.region, accountIds.length);
    if (target.channelId === oldChannelId) throw new Error('transfer_same_channel');
    const expiresAtMs = request.nowMs + this.options.leaseDurationMs;
    const leases = accountIds.map((accountId) => ({ accountId, channelId: target.channelId, leaseId: this.options.createLeaseId(), expiresAtMs }));
    const transferId = this.options.createTransferId?.() ?? `${target.channelId}:${request.accountId}:${request.nowMs}`;
    this.transfers.set(transferId, { accountIds, oldChannelId, newChannelId: target.channelId, leases, state: 'reserved' });
    const leader = leases.find((lease) => lease.accountId === request.accountId)!;
    return { transferId, accountId: request.accountId, channelId: leader.channelId, leaseId: leader.leaseId, state: 'reserved' };
  }

  commitTransfer(transferId: string): ChannelTransfer {
    const transfer = this.transfers.get(transferId);
    if (!transfer) throw new Error('transfer_not_found');
    if (transfer.state === 'committed') return resultForTransfer(transferId, transfer, transfer.accountIds[0]!);
    if (transfer.state === 'rolled-back') throw new Error('transfer_rolled_back');
    for (const accountId of transfer.accountIds) this.leases.delete(accountId);
    this.options.channels.release(transfer.oldChannelId, transfer.accountIds.length);
    for (const lease of transfer.leases) this.leases.set(lease.accountId, lease);
    transfer.state = 'committed';
    return resultForTransfer(transferId, transfer, transfer.accountIds[0]!);
  }

  rollbackTransfer(transferId: string) {
    const transfer = this.transfers.get(transferId);
    if (!transfer) throw new Error('transfer_not_found');
    if (transfer.state === 'committed') throw new Error('transfer_committed');
    if (transfer.state === 'rolled-back') return;
    this.options.channels.release(transfer.newChannelId, transfer.accountIds.length);
    transfer.state = 'rolled-back';
  }

  private expireLeases(accountIds: readonly string[], nowMs: number) {
    for (const accountId of accountIds) {
      const lease = this.leases.get(accountId);
      if (!lease || lease.expiresAtMs > nowMs) continue;
      this.leases.delete(accountId);
      this.options.channels.release(lease.channelId, 1);
    }
  }
}

function uniqueParty(accountId: string, partyAccountIds: readonly string[] | undefined) {
  const accounts = [...new Set(partyAccountIds ?? [accountId])];
  if (!accounts.includes(accountId)) accounts.unshift(accountId);
  if (accounts.length < 1 || accounts.length > 4 || accounts.some((id) => !id))
    throw new Error('party_capacity');
  return accounts;
}

function asResult(lease: Lease, reason: AssignmentResult['reason']): AssignmentResult {
  return {
    channelId: lease.channelId,
    leaseId: lease.leaseId,
    expiresAtMs: lease.expiresAtMs,
    reason,
  };
}

function resultForTransfer(transferId: string, transfer: { accountIds: string[]; leases: Lease[]; state: ChannelTransfer['state'] }, accountId: string): ChannelTransfer {
  const lease = transfer.leases.find((entry) => entry.accountId === accountId)!;
  return { transferId, accountId, channelId: lease.channelId, leaseId: lease.leaseId, state: transfer.state };
}
