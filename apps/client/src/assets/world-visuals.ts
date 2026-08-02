import type { MotionProfileName } from '../game/animation/motionProfiles';

export type WorldVisualDefinition = {
  id: string;
  textureKey: string;
  sourcePath: string;
  baseScale: number;
  anchorX: number;
  anchorY: number;
  shadowScale: number;
  defaultFacing: 'left' | 'right';
  motionProfile: MotionProfileName;
  frameCount: number;
};

const visual = (
  id: string,
  textureKey: string,
  sourcePath: string,
  motionProfile: MotionProfileName,
  options: Partial<Pick<WorldVisualDefinition, 'baseScale' | 'anchorX' | 'anchorY' | 'shadowScale'>> = {},
): WorldVisualDefinition => ({
  id,
  textureKey,
  sourcePath,
  baseScale: options.baseScale ?? 1,
  anchorX: options.anchorX ?? 0.5,
  anchorY: options.anchorY ?? 0.82,
  shadowScale: options.shadowScale ?? 1,
  defaultFacing: 'right',
  motionProfile,
  frameCount: 1,
});

export const WORLD_VISUALS: readonly WorldVisualDefinition[] = [
  visual('hero_001_grilled_chicken', 'hero.grilled_chicken.world', '/assets/game/heroes/hero_001_grilled_chicken/world.webp', 'normal'),
  visual('hero_002_pink_chocolate_lizard', 'hero.pink_chocolate_lizard.world', '/assets/game/heroes/hero_002_pink_chocolate_lizard/world.webp', 'light'),
  visual('hero_003_robot_jelly', 'hero.robot_jelly.world', '/assets/game/heroes/hero_003_robot_jelly/world.webp', 'jelly'),
  visual('hero_004_tofu_rabbit', 'hero.tofu_rabbit.world', '/assets/game/heroes/hero_004_tofu_rabbit/world.webp', 'floating'),
  visual('hero_005_accountant_octopus', 'hero.accountant_octopus.world', '/assets/game/heroes/hero_005_accountant_octopus/world.webp', 'normal'),
  visual('hero_006_samurai_bread', 'hero.samurai_bread.world', '/assets/game/heroes/hero_006_samurai_bread/world.webp', 'heavy'),
  visual('grumpy-radish', 'monster.grumpy_radish.world', '/assets/game/monsters/monster_001_grumpy_radish/world.webp', 'normal'),
  visual('jumping-sauce-bag', 'monster.jumping_sauce_bag.world', '/assets/game/monsters/monster_002_jumping_sauce_bag/world.webp', 'light'),
  visual('shoe-biting-dust-ball', 'monster.shoe_biting_dust_ball.world', '/assets/game/monsters/monster_003_shoe_biting_dust_ball/world.webp', 'floating'),
  visual('wild-sausage', 'monster.wild_sausage.world', '/assets/game/monsters/monster_004_wild_sausage/world.webp', 'heavy'),
  visual('lost-pudding', 'monster.lost_pudding.world', '/assets/game/monsters/monster_005_lost_pudding/world.webp', 'jelly'),
  visual('angry-refrigerator', 'boss.angry_refrigerator.world', '/assets/game/bosses/boss_001_angry_refrigerator/world.webp', 'boss', { baseScale: 1.45, shadowScale: 1.5 }),
  visual('frozen-food-add-left', 'add.frozen_food.left.world', '/assets/game/adds/frozen_food_left/world.webp', 'light', { baseScale: 0.8 }),
  visual('frozen-food-add-right', 'add.frozen_food.right.world', '/assets/game/adds/frozen_food_right/world.webp', 'light', { baseScale: 0.8 }),
  visual('summon-shrine-keeper', 'npc.summon_shrine_keeper.world', '/assets/game/npcs/summon_shrine_keeper/world.webp', 'floating'),
  visual('team-station-keeper', 'npc.team_station_keeper.world', '/assets/game/npcs/team_station_keeper/world.webp', 'normal'),
  visual('afk-chest-mimic', 'npc.afk_chest_mimic.world', '/assets/game/npcs/afk_chest_mimic/world.webp', 'jelly'),
] as const;

export function worldVisualFor(id: string): WorldVisualDefinition | null {
  return WORLD_VISUALS.find((entry) => entry.id === id) ?? null;
}

export function validateWorldVisuals(visuals: readonly WorldVisualDefinition[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const textureKeys = new Set<string>();
  for (const entry of visuals) {
    if (ids.has(entry.id)) errors.push(`Duplicate world visual id: ${entry.id}`);
    if (textureKeys.has(entry.textureKey)) errors.push(`Duplicate world texture key: ${entry.textureKey}`);
    ids.add(entry.id);
    textureKeys.add(entry.textureKey);
    if (entry.anchorX < 0 || entry.anchorX > 1 || entry.anchorY < 0 || entry.anchorY > 1)
      errors.push(`Invalid world visual anchor: ${entry.id}`);
    if (!(entry.baseScale > 0) || !(entry.shadowScale > 0))
      errors.push(`Invalid world visual scale: ${entry.id}`);
    if (!entry.sourcePath.endsWith('/world.webp') || entry.frameCount !== 1)
      errors.push(`World visual must be one WebP image: ${entry.id}`);
  }
  return errors;
}
