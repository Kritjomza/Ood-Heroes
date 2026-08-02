import { describe, expect, it } from 'vitest';
import {
  monsterFlipX,
  monsterTextureKey,
} from '../src/game/scenes/heroDirectionalSprites';

describe('lightweight mirrored sprite runtime', () => {
  it('maps five monster identities and fails safely for unknown values', () => {
    expect(monsterTextureKey('grumpy-radish')).toBe('monster.grumpy_radish.world');
    expect(monsterTextureKey('jumping-sauce-bag')).toBe('monster.jumping_sauce_bag.world');
    expect(monsterTextureKey('shoe-biting-dust-ball')).toBe('monster.shoe_biting_dust_ball.world');
    expect(monsterTextureKey('wild-sausage')).toBe('monster.wild_sausage.world');
    expect(monsterTextureKey('lost-pudding')).toBe('monster.lost_pudding.world');
    expect(monsterTextureKey('unknown')).toBeNull();
    expect(monsterFlipX('left')).toBe(true);
    expect(monsterFlipX('right')).toBe(false);
  });
});
