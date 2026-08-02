import { starUpgradeCost } from '@odd-tower/game-core';
import type { PersistentHeroRole, PlayerBootstrap } from '@odd-tower/network-protocol';

export type DerivedTeamView = {
  occupied: number;
  capacity: number;
  averageLevel: number;
  totalStars: number;
  roleCounts: Partial<Record<PersistentHeroRole, number>>;
  duplicateRoles: PersistentHeroRole[];
};

export type DerivedPlayerView = {
  collection: { owned: number; total: number; percent: number; upgradeReady: number };
  roleCounts: Partial<Record<PersistentHeroRole, number>>;
  affordableSummons: number;
  pityPercent: number;
  nextUpgradeHeroId: string | null;
  team: DerivedTeamView;
};

export function deriveTeamView(player: PlayerBootstrap, selectedIds: string[]): DerivedTeamView {
  const heroes = new Map(player.heroes.map((hero) => [hero.id, hero]));
  const definitions = new Map(
    player.heroDefinitions.map((definition) => [definition.id, definition]),
  );
  const selected = selectedIds.flatMap((id) => (heroes.has(id) ? [heroes.get(id)!] : []));
  const roleCounts: Partial<Record<PersistentHeroRole, number>> = {};
  for (const hero of selected) {
    const role = definitions.get(hero.definitionId)?.role;
    if (role) roleCounts[role] = (roleCounts[role] ?? 0) + 1;
  }
  return {
    occupied: selected.length,
    capacity: player.profile.teamSlots,
    averageLevel: selected.length
      ? Math.round(selected.reduce((sum, hero) => sum + hero.level, 0) / selected.length)
      : 0,
    totalStars: selected.reduce((sum, hero) => sum + hero.stars, 0),
    roleCounts,
    duplicateRoles: (Object.entries(roleCounts) as Array<[PersistentHeroRole, number]>)
      .filter(([, count]) => count > 1)
      .map(([role]) => role),
  };
}

export function derivePlayerView(player: PlayerBootstrap): DerivedPlayerView {
  const total = player.heroDefinitions.length;
  const upgradeReady = player.heroes.filter((hero) => {
    const cost = starUpgradeCost(hero.stars);
    return cost !== null && hero.shards >= cost;
  });
  const roleCounts: Partial<Record<PersistentHeroRole, number>> = {};
  const definitions = new Map(
    player.heroDefinitions.map((definition) => [definition.id, definition]),
  );
  for (const hero of player.heroes) {
    const role = definitions.get(hero.definitionId)?.role;
    if (role) roleCounts[role] = (roleCounts[role] ?? 0) + 1;
  }
  const activeIds = [...player.activeTeam.slots]
    .sort((a, b) => a.slotIndex - b.slotIndex)
    .map((slot) => slot.playerHeroId);
  return {
    collection: {
      owned: player.heroes.length,
      total,
      percent: total ? Math.round((player.heroes.length / total) * 100) : 0,
      upgradeReady: upgradeReady.length,
    },
    roleCounts,
    affordableSummons:
      player.banner.gemCost > 0 ? Math.floor(player.currencies.gem / player.banner.gemCost) : 0,
    pityPercent:
      player.banner.pityThreshold > 0
        ? Math.min(
            100,
            Math.round((player.banner.pullsSinceEpic / player.banner.pityThreshold) * 100),
          )
        : 0,
    nextUpgradeHeroId: upgradeReady[0]?.id ?? null,
    team: deriveTeamView(player, activeIds),
  };
}
