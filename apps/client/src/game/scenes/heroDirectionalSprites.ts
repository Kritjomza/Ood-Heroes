import type { CardinalDirection } from '@odd-tower/network-protocol';

export const HERO_WORLD_ASSET_IDS = {
  hero_001_grilled_chicken: 'hero.grilled_chicken.world',
  hero_002_pink_chocolate_lizard: 'hero.pink_chocolate_lizard.world',
  hero_003_robot_jelly: 'hero.robot_jelly.world',
  hero_004_tofu_rabbit: 'hero.tofu_rabbit.world',
  hero_005_accountant_octopus: 'hero.accountant_octopus.world',
  hero_006_samurai_bread: 'hero.samurai_bread.world',
} as const;

export type HeroDefinitionId = keyof typeof HERO_WORLD_ASSET_IDS;

export function heroTextureKey(definitionId: string): string | null {
  return Object.prototype.hasOwnProperty.call(HERO_WORLD_ASSET_IDS, definitionId)
    ? HERO_WORLD_ASSET_IDS[definitionId as HeroDefinitionId]
    : null;
}

export type HorizontalFacing = 'left' | 'right';

export function nextHorizontalFacing(
  direction: CardinalDirection,
  previous: HorizontalFacing,
): HorizontalFacing {
  return direction === 'left' || direction === 'right' ? direction : previous;
}

export function shouldMirrorWorldSprite(facing: HorizontalFacing) {
  return facing === 'left';
}

export const MONSTER_ASSET_IDS = {
  'grumpy-radish': 'monster.grumpy_radish.world',
  'jumping-sauce-bag': 'monster.jumping_sauce_bag.world',
  'shoe-biting-dust-ball': 'monster.shoe_biting_dust_ball.world',
  'wild-sausage': 'monster.wild_sausage.world',
  'lost-pudding': 'monster.lost_pudding.world',
} as const;

export function monsterTextureKey(definitionId: string): string | null {
  return Object.prototype.hasOwnProperty.call(MONSTER_ASSET_IDS, definitionId)
    ? MONSTER_ASSET_IDS[definitionId as keyof typeof MONSTER_ASSET_IDS]
    : null;
}

export function monsterFlipX(facing: HorizontalFacing) {
  return facing === 'left';
}
