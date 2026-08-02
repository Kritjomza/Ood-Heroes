import { describe, expect, it } from 'vitest';
import {
  MOTION_PROFILES,
  createMotionState,
  updateSingleSpriteMotion,
} from '../src/game/animation/SingleSpriteMotionController';

describe('single-sprite motion state', () => {
  it('ignores horizontal noise and preserves facing during vertical movement', () => {
    const initial = createMotionState('normal', 'right', 0.25);
    const noise = updateSingleSpriteMotion(initial, { velocityX: -3, velocityY: -80, nowMs: 200 });
    expect(noise.facing).toBe('right');
    expect(noise.flipX).toBe(false);
    const left = updateSingleSpriteMotion(noise, { velocityX: -12, velocityY: 0, nowMs: 240 });
    expect(left.facing).toBe('left');
    expect(left.flipX).toBe(true);
    expect(updateSingleSpriteMotion(left, { velocityX: 0, velocityY: 90, nowMs: 280 }).facing).toBe('left');
  });

  it('enters idle after the timeout and produces subtle visual-only offsets', () => {
    const initial = createMotionState('normal', 'right', 0);
    const stopped = updateSingleSpriteMotion(initial, { velocityX: 0, velocityY: 0, nowMs: 160 });
    expect(stopped.mode).toBe('idle');
    expect(Math.abs(stopped.visualY)).toBeLessThanOrEqual(1.5);
    expect(stopped.scaleX).toBeGreaterThanOrEqual(0.985);
    expect(stopped.scaleX).toBeLessThanOrEqual(1.015);
    expect(stopped.rootOffsetX).toBe(0);
    expect(stopped.rootOffsetY).toBe(0);
  });

  it('uses speed magnitude for walking without platform-jump deformation', () => {
    const walking = updateSingleSpriteMotion(createMotionState('light', 'right', 0), {
      velocityX: 84,
      velocityY: 84,
      nowMs: 250,
    });
    expect(walking.mode).toBe('walking');
    expect(walking.speed).toBeCloseTo(118.79, 1);
    expect(Math.abs(walking.visualY)).toBeLessThanOrEqual(3.5);
    expect(Math.abs(walking.angle)).toBeLessThanOrEqual(3.5);
  });

  it('provides distinct bounded profiles for light, normal, heavy, jelly, floating, and boss', () => {
    expect(Object.keys(MOTION_PROFILES)).toEqual(['light', 'normal', 'heavy', 'jelly', 'floating', 'boss']);
    expect(MOTION_PROFILES.heavy.walkBobPixels).toBeLessThan(MOTION_PROFILES.light.walkBobPixels);
    expect(MOTION_PROFILES.jelly.walkScaleAmplitude).toBeGreaterThan(MOTION_PROFILES.normal.walkScaleAmplitude);
    expect(MOTION_PROFILES.boss.walkTiltDegrees).toBeLessThanOrEqual(1);
  });
});
