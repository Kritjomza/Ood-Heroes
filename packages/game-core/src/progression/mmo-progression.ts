import { requiredExperienceForNextLevel } from '../rules.js';

export const MMO_MAX_ADVENTURE_RANK = 20 as const;
export const MMO_MAX_HERO_LEVEL = 100 as const;
export const MMO_RESERVE_XP_RATIO = 0.35 as const;

export type AdventureProgress = {
  rank: number;
  experience: number;
};

export type MmoHeroProgress = {
  id: string;
  level: number;
  experience: number;
};

export type ProgressionGrant = {
  adventure: AdventureProgress;
  heroes: MmoHeroProgress[];
  deployedXp: number;
  reserveXp: number;
  heroLevelCap: number;
};

export function adventureRankCap(rank: number) {
  const safeRank = Math.max(1, Math.min(MMO_MAX_ADVENTURE_RANK, Math.floor(rank)));
  return Math.min(MMO_MAX_HERO_LEVEL, safeRank * 5);
}

export function adventureRankXp(rank: number) {
  const safeRank = Math.max(1, Math.min(MMO_MAX_ADVENTURE_RANK, Math.floor(rank)));
  return Math.floor(250 * safeRank ** 1.35);
}

export function grantEncounterXp(
  adventure: AdventureProgress,
  heroes: readonly MmoHeroProgress[],
  deployedHeroIds: readonly string[],
  reserveHeroIds: readonly string[],
  encounterXp: number,
): ProgressionGrant {
  const xp = Math.max(0, Math.floor(encounterXp));
  const deployed = new Set(deployedHeroIds);
  const reserve = new Set(reserveHeroIds.filter((id) => !deployed.has(id)));
  const nextAdventure = advanceAdventure(adventure, xp);
  const cap = adventureRankCap(nextAdventure.rank);
  let deployedXp = 0;
  let reserveXp = 0;
  const nextHeroes = heroes.map((hero) => {
    const full = deployed.has(hero.id);
    const partial = reserve.has(hero.id);
    if (!full && !partial) return { ...hero };
    const baseXp = full ? xp : Math.floor(xp * MMO_RESERVE_XP_RATIO);
    const catchup = hero.level <= 2 || hero.level < cap - 2 ? 1.5 : 1;
    const grant = Math.floor(baseXp * catchup);
    if (full) deployedXp += grant;
    else reserveXp += grant;
    return advanceHero(hero, grant, cap);
  });
  return { adventure: nextAdventure, heroes: nextHeroes, deployedXp, reserveXp, heroLevelCap: cap };
}

export function useHeroXpItem(hero: MmoHeroProgress, itemXp: number, adventure: AdventureProgress) {
  const grant = Math.max(0, Math.floor(itemXp));
  return advanceHero(hero, grant, adventureRankCap(adventure.rank));
}

function advanceAdventure(progress: AdventureProgress, earnedXp: number): AdventureProgress {
  let rank = Math.max(1, Math.min(MMO_MAX_ADVENTURE_RANK, Math.floor(progress.rank)));
  let experience = Math.max(0, Math.floor(progress.experience)) + earnedXp;
  while (rank < MMO_MAX_ADVENTURE_RANK && experience >= adventureRankXp(rank)) {
    experience -= adventureRankXp(rank);
    rank += 1;
  }
  if (rank === MMO_MAX_ADVENTURE_RANK) experience = 0;
  return { rank, experience };
}

function advanceHero(hero: MmoHeroProgress, earnedXp: number, cap: number): MmoHeroProgress {
  let level = Math.max(1, Math.min(MMO_MAX_HERO_LEVEL, Math.floor(hero.level)));
  let experience = Math.max(0, Math.floor(hero.experience)) + earnedXp;
  while (level < cap && experience >= requiredExperienceForNextLevel(level)) {
    experience -= requiredExperienceForNextLevel(level);
    level += 1;
  }
  if (level >= cap) experience = 0;
  return { id: hero.id, level, experience };
}
