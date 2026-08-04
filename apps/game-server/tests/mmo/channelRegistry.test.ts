import { describe, expect, it } from 'vitest';
import { ChannelRegistry } from '../../src/mmo/channels/ChannelRegistry';

describe('MMO channel registry', () => {
  it('fills a healthy channel without crossing its hard capacity', () => {
    let nextId = 1;
    const registry = new ChannelRegistry({
      capacity: 30,
      createId: () => `channel-${nextId++}`,
      nowMs: () => 100,
    });

    expect(registry.assign('floor-1', 'asia-se', 4)).toMatchObject({
      channelId: 'channel-1',
      population: 4,
      capacity: 30,
    });
    expect(registry.assign('floor-1', 'asia-se', 26).population).toBe(30);
    expect(registry.assign('floor-1', 'asia-se', 1).channelId).toBe('channel-2');
    expect(registry.get('channel-1')?.population).toBe(30);
  });

  it('reserves a whole party or rejects the assignment without changing population', () => {
    const registry = new ChannelRegistry({ capacity: 30, createId: () => 'channel-1', nowMs: () => 1 });
    registry.assign('floor-1', 'asia-se', 28);

    expect(() => registry.reserve('channel-1', 4)).toThrow('channel_capacity');
    expect(registry.get('channel-1')?.population).toBe(28);
    expect(() => registry.assign('floor-1', 'asia-se', 31)).toThrow('party_capacity');
  });

  it('releases bounded population and never drops below zero', () => {
    const registry = new ChannelRegistry({ capacity: 30, createId: () => 'channel-1', nowMs: () => 1 });
    registry.assign('floor-1', 'asia-se', 3);

    registry.release('channel-1', 2);
    registry.release('channel-1', 5);

    expect(registry.get('channel-1')?.population).toBe(0);
  });
});
