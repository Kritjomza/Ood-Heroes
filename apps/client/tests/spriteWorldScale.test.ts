import { describe, expect, it } from 'vitest';
import { composeWorldScale, worldScaleForHeight } from '../src/game/rendering/spriteWorldScale';

describe('world sprite scale', () => {
  it('normalizes large source art to a bounded world height', () => {
    expect(worldScaleForHeight(2048, 80)).toBeCloseTo(0.0390625);
    expect(worldScaleForHeight(0, 80)).toBe(1);
  });

  it('composes motion around the normalized base scale', () => {
    const result = composeWorldScale(0.04, 1.025, 0.975);
    expect(result.x).toBeCloseTo(0.041);
    expect(result.y).toBeCloseTo(0.039);
  });
});
