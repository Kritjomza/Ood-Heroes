import { describe, expect, it } from 'vitest';
import {
  HERO_WORLD_ASSET_IDS,
  heroTextureKey,
  nextHorizontalFacing,
  shouldMirrorWorldSprite,
} from '../src/game/scenes/heroDirectionalSprites';

describe('hero single-world-sprite contract', () => {
  it('maps all six persistent definition IDs to distinct world image IDs', () => {
    expect(HERO_WORLD_ASSET_IDS).toEqual({
      hero_001_grilled_chicken: 'hero.grilled_chicken.world',
      hero_002_pink_chocolate_lizard: 'hero.pink_chocolate_lizard.world',
      hero_003_robot_jelly: 'hero.robot_jelly.world',
      hero_004_tofu_rabbit: 'hero.tofu_rabbit.world',
      hero_005_accountant_octopus: 'hero.accountant_octopus.world',
      hero_006_samurai_bread: 'hero.samurai_bread.world',
    });
  });

  it('retains horizontal facing through vertical and idle movement and mirrors left', () => {
    expect(nextHorizontalFacing('right', 'left')).toBe('right');
    expect(nextHorizontalFacing('up', 'right')).toBe('right');
    expect(nextHorizontalFacing('down', 'left')).toBe('left');
    expect(nextHorizontalFacing('none', 'right')).toBe('right');
    expect(shouldMirrorWorldSprite('right')).toBe(false);
    expect(shouldMirrorWorldSprite('left')).toBe(true);
  });

  it('fails safely for missing, unknown, and role-only identities', () => {
    expect(heroTextureKey('')).toBeNull();
    expect(heroTextureKey('hero_unknown_future')).toBeNull();
    expect(heroTextureKey('fighter')).toBeNull();
  });
});
