import { describe, expect, it } from 'vitest';
import { ChannelRegistry } from '../../src/mmo/channels/ChannelRegistry';
import { WorldDirectory } from '../../src/mmo/directory/WorldDirectory';

function setup() {
  let channelId = 1;
  let leaseId = 1;
  const channels = new ChannelRegistry({
    capacity: 30,
    createId: () => `channel-${channelId++}`,
    nowMs: () => 100,
  });
  const directory = new WorldDirectory({
    channels,
    createLeaseId: () => `lease-${leaseId++}`,
    leaseDurationMs: 15_000,
  });
  return { channels, directory };
}

describe('MMO world directory', () => {
  it('reuses a valid reconnect lease without reserving another channel slot', () => {
    const { channels, directory } = setup();
    const first = directory.assign({ accountId: 'account-1', zoneId: 'floor-1', region: 'asia-se', nowMs: 1_000 });
    const reconnect = directory.assign({ accountId: 'account-1', zoneId: 'floor-1', region: 'asia-se', nowMs: 2_000 });

    expect(reconnect).toEqual({ ...first, reason: 'reconnect' });
    expect(channels.get(first.channelId)?.population).toBe(1);
  });

  it('replaces an expired lease and releases its old reservation', () => {
    const { channels, directory } = setup();
    const first = directory.assign({ accountId: 'account-1', zoneId: 'floor-1', region: 'asia-se', nowMs: 1_000 });
    const replacement = directory.assign({ accountId: 'account-1', zoneId: 'floor-2', region: 'asia-se', nowMs: 20_000 });

    expect(replacement.leaseId).not.toBe(first.leaseId);
    expect(channels.get(first.channelId)?.population).toBe(0);
    expect(channels.get(replacement.channelId)?.population).toBe(1);
    expect(directory.activeLeaseCount('account-1')).toBe(1);
  });

  it('keeps a party together and prioritizes a requested friend channel that fits', () => {
    const { channels, directory } = setup();
    const friend = channels.assign('floor-1', 'asia-se', 5);
    const result = directory.assign({
      accountId: 'account-a',
      partyAccountIds: ['account-a', 'account-b', 'account-c', 'account-d'],
      friendChannelId: friend.channelId,
      zoneId: 'floor-1',
      region: 'asia-se',
      nowMs: 1_000,
    });

    expect(result.channelId).toBe(friend.channelId);
    expect(result.reason).toBe('friend');
    expect(channels.get(friend.channelId)?.population).toBe(9);
    for (const accountId of ['account-a', 'account-b', 'account-c', 'account-d'])
      expect(directory.activeLeaseCount(accountId)).toBe(1);
  });

  it('does not split or partially reserve a party when a member has a live lease elsewhere', () => {
    const { channels, directory } = setup();
    const existing = directory.assign({ accountId: 'account-b', zoneId: 'floor-2', region: 'asia-se', nowMs: 1_000 });

    expect(() =>
      directory.assign({
        accountId: 'account-a',
        partyAccountIds: ['account-a', 'account-b'],
        zoneId: 'floor-1',
        region: 'asia-se',
        nowMs: 2_000,
      }),
    ).toThrow('party_lease_conflict');
    expect(channels.get(existing.channelId)?.population).toBe(1);
    expect(directory.activeLeaseCount('account-a')).toBe(0);
  });

  it('releases one account lease and its reserved population exactly once', () => {
    const { channels, directory } = setup();
    const assigned = directory.assign({
      accountId: 'account-1',
      zoneId: 'floor-1',
      region: 'asia-se',
      nowMs: 1_000,
    });

    expect(directory.release('account-1', assigned.leaseId)).toBe(true);
    expect(directory.release('account-1', assigned.leaseId)).toBe(false);
    expect(channels.get(assigned.channelId)?.population).toBe(0);
  });
});
