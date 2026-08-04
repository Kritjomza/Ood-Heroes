import { describe, expect, it } from 'vitest';
import { ChannelRegistry } from '../../src/mmo/channels/ChannelRegistry.js';
import { WorldDirectory } from '../../src/mmo/directory/WorldDirectory.js';

describe('safe channel transfers', () => {
  it('reserves then commits a party atomically', () => {
    let lease = 0;
    const channels = new ChannelRegistry({ capacity: 4, createId: () => `channel-${Date.now()}-${Math.random()}`, nowMs: () => 1 });
    const directory = new WorldDirectory({ channels, createLeaseId: () => `lease-${++lease}`, createTransferId: () => 'transfer-1', leaseDurationMs: 10_000 });
    directory.assign({ accountId: 'a', partyAccountIds: ['a', 'b'], zoneId: 'floor-1', region: 'auto', nowMs: 1 });
    const transfer = directory.prepareTransfer({ accountId: 'a', partyAccountIds: ['a', 'b'], zoneId: 'floor-2', region: 'auto', nowMs: 2 });
    expect(transfer.state).toBe('reserved');
    expect(directory.activeLeaseCount('a')).toBe(1);
    expect(directory.commitTransfer(transfer.transferId).state).toBe('committed');
  });

  it('rolls back a reservation without losing the original lease', () => {
    let lease = 0;
    const channels = new ChannelRegistry({ capacity: 2, createId: () => `channel-${++lease}`, nowMs: () => 1 });
    const directory = new WorldDirectory({ channels, createLeaseId: () => `lease-${++lease}`, createTransferId: () => 'transfer-2', leaseDurationMs: 10_000 });
    directory.assign({ accountId: 'a', zoneId: 'floor-1', region: 'auto', nowMs: 1 });
    const transfer = directory.prepareTransfer({ accountId: 'a', zoneId: 'floor-2', region: 'auto', nowMs: 2 });
    directory.rollbackTransfer(transfer.transferId);
    expect(directory.activeLeaseCount('a')).toBe(1);
    expect(() => directory.commitTransfer(transfer.transferId)).toThrow('transfer_rolled_back');
  });
});
