import { describe, expect, it } from 'vitest';
import { fitInside } from '../src/game/rendering/worldAssetLayout';
import { syncCameraTarget } from '../src/game/rendering/onlineCameraRig';

describe('world asset layout', () => {
  it('fits wide and tall artwork without distortion', () => {
    expect(fitInside(669, 373, 224, 176)).toEqual({ width: 224, height: expect.closeTo(124.88, 1) });
    expect(fitInside(1024, 1536, 84, 84)).toEqual({ width: 56, height: 84 });
  });

  it('keeps a persistent camera target synchronized to the team root', () => {
    const positions: number[][] = [];
    const target = { setPosition: (x: number, y: number) => positions.push([x, y]) };
    syncCameraTarget(target, { x: 640, y: 912 });
    syncCameraTarget(target, { x: 700, y: 940 });
    expect(positions).toEqual([[640, 912], [700, 940]]);
  });
});
