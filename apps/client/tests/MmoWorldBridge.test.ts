import { describe, expect, it, vi } from 'vitest';
import { initialMmoWorldState, MmoWorldBridge } from '../src/mmo/MmoWorldBridge';

describe('MMO world bridge', () => {
  it('publishes immutable meaningful state and unsubscribes cleanly', () => {
    const bridge = new MmoWorldBridge();
    const listener = vi.fn();
    const unsubscribe = bridge.subscribe(listener);

    bridge.update({ connection: 'joining' });
    bridge.update({ connection: 'joining' });

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenLastCalledWith({ ...initialMmoWorldState, connection: 'joining' });
    expect(Object.isFrozen(bridge.snapshot())).toBe(true);
    unsubscribe();
    expect(bridge.listenerCount).toBe(0);
  });

  it('ignores snapshots older than the last authoritative world revision', () => {
    const bridge = new MmoWorldBridge();
    bridge.applyWorldSnapshot({
      channelId: 'channel-1',
      zoneId: 'floor-1',
      population: 2,
      worldRevision: 8,
      connectionState: 'connected',
    });
    bridge.applyWorldSnapshot({
      channelId: 'channel-old',
      zoneId: 'floor-old',
      population: 1,
      worldRevision: 7,
      connectionState: 'connected',
    });

    expect(bridge.snapshot()).toMatchObject({
      channelId: 'channel-1',
      zoneId: 'floor-1',
      population: 2,
      worldRevision: 8,
    });
  });
});
