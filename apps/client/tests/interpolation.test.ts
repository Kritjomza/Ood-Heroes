import { describe, expect, it } from 'vitest';
import { RemoteInterpolator } from '../src/game/multiplayer/interpolation';
import type { CardinalDirection } from '@odd-tower/network-protocol';

const snapshot = (x: number, atMs: number, direction: CardinalDirection = 'right') => ({
  atMs,
  id: 'remote',
  displayName: 'Remote',
  x,
  y: 100,
  direction,
  moving: direction !== 'none',
  connected: true,
  lastProcessedInputSequence: 1,
});

describe('remote buffered interpolation', () => {
  it('interpolates a midpoint and uses the earlier direction until the newer snapshot', () => {
    const buffer = new RemoteInterpolator();
    buffer.add(snapshot(100, 0, 'right'));
    buffer.add(snapshot(120, 100, 'down'));
    expect(buffer.sample('remote', 50)).toMatchObject({ x: 110, y: 100, direction: 'right' });
    expect(buffer.sample('remote', 100)).toMatchObject({ x: 120, direction: 'down' });
  });

  it('returns the latest snapshot when no future sample exists and movement is idle', () => {
    const buffer = new RemoteInterpolator();
    buffer.add(snapshot(100, 0, 'none'));
    expect(buffer.sample('remote', 80)).toMatchObject({ x: 100, moving: false });
  });

  it('extrapolates cardinal movement briefly then stops at the bounded limit', () => {
    const buffer = new RemoteInterpolator();
    buffer.add(snapshot(100, 100, 'right'));
    expect(buffer.sample('remote', 150)?.x).toBe(106);
    expect(buffer.sample('remote', 400)?.x).toBe(118);
  });

  it('snaps teleport-sized discontinuities instead of traversing them', () => {
    const buffer = new RemoteInterpolator();
    buffer.add(snapshot(100, 0));
    buffer.add(snapshot(300, 100));
    expect(buffer.sample('remote', 50)?.x).toBe(100);
    expect(buffer.sample('remote', 100)?.x).toBe(300);
  });

  it('trims buffers to twenty snapshots and removes player state', () => {
    const buffer = new RemoteInterpolator();
    for (let index = 0; index < 25; index++) buffer.add(snapshot(index, index * 10));
    expect(buffer.sizeFor('remote')).toBe(20);
    buffer.remove('remote');
    expect(buffer.sample('remote', 200)).toBeNull();
    expect(buffer.playerCount).toBe(0);
  });
});
