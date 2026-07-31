import type { PersistentHeroDefinition } from './hero-definitions.js';
import { requiredExperienceForNextLevel } from './rules.js';

export const HERO_LEVEL_CAP = 20;

const EXPERIENCE_CAP = Array.from({ length: HERO_LEVEL_CAP - 1 }, (_, index) =>
  requiredExperienceForNextLevel(index + 1),
).reduce((sum, value) => sum + value, 0);

export function totalExperienceCap() {
  return EXPERIENCE_CAP;
}

export function levelFromTotalExperience(totalExperience: number) {
  if (!Number.isSafeInteger(totalExperience) || totalExperience < 0)
    throw new Error('INVALID_TOTAL_EXPERIENCE');
  let remaining = Math.min(totalExperience, EXPERIENCE_CAP);
  let level = 1;
  while (level < HERO_LEVEL_CAP) {
    const required = requiredExperienceForNextLevel(level);
    if (remaining < required) break;
    remaining -= required;
    level += 1;
  }
  return level;
}

export function effectiveHeroStats(
  definition: PersistentHeroDefinition,
  totalExperience: number,
  stars: number,
) {
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) throw new Error('INVALID_HERO_STARS');
  const level = levelFromTotalExperience(totalExperience);
  let maxHp = definition.baseHp;
  let attack = definition.baseAttack;
  let defense = definition.baseDefense;
  for (let current = 1; current < level; current += 1) {
    maxHp = Math.round(maxHp * 1.1);
    attack = Math.round(attack * 1.08);
    defense = Math.round(defense * 1.06);
  }
  const starMultiplier = 1 + 0.08 * (stars - 1);
  return {
    level,
    maxHp: Math.round(maxHp * starMultiplier),
    attack: Math.round(attack * starMultiplier),
    defense: Math.round(defense * starMultiplier),
    moveSpeed: definition.moveSpeed,
    attackRange: definition.attackRange,
    attackCooldownMs: definition.attackCooldownMs,
  };
}
