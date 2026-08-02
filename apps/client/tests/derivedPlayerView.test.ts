import { describe, expect, it } from 'vitest';
import type { PlayerBootstrap } from '@odd-tower/network-protocol';
import { derivePlayerView, deriveTeamView } from '../src/ui/persistent/derived-player-view';

const player: PlayerBootstrap = {
  contractVersion: 1,
  schemaVersion: 1,
  serverTime: '2026-08-02T00:00:00.000Z',
  profile: {
    userId: 'user',
    displayName: 'Odd Tester',
    accountKind: 'guest',
    teamSlots: 2,
    onboardingStep: 0,
  },
  currencies: { gold: 500, gem: 300, upgradeJelly: 0 },
  heroDefinitions: [
    {
      id: 'fighter-a',
      displayName: 'Chicken',
      role: 'fighter',
      rarity: 'common',
      assetKey: 'hero.a',
    },
    { id: 'fighter-b', displayName: 'Bread', role: 'fighter', rarity: 'rare', assetKey: 'hero.b' },
  ],
  heroes: [
    {
      id: 'hero-a',
      definitionId: 'fighter-a',
      totalExperience: 20,
      level: 4,
      stars: 2,
      shards: 999,
    },
    { id: 'hero-b', definitionId: 'fighter-b', totalExperience: 10, level: 2, stars: 1, shards: 0 },
  ],
  activeTeam: { id: 'team', name: 'Main Team', slots: [{ slotIndex: 1, playerHeroId: 'hero-a' }] },
  banner: {
    id: 'banner',
    displayName: 'Odd Summon',
    gemCost: 100,
    pityThreshold: 20,
    pullsSinceEpic: 5,
    totalPulls: 5,
  },
  pendingAfkClaim: null,
  persistence: { status: 'healthy', queueDepth: 0 },
};

describe('derived player view', () => {
  it('derives collection, summon, upgrade, and active-team summaries', () => {
    const view = derivePlayerView(player);
    expect(view.collection).toEqual({ owned: 2, total: 2, percent: 100, upgradeReady: 1 });
    expect(view.affordableSummons).toBe(3);
    expect(view.pityPercent).toBe(25);
    expect(view.nextUpgradeHeroId).toBe('hero-a');
    expect(view.team).toMatchObject({ occupied: 1, capacity: 2, averageLevel: 4, totalStars: 2 });
  });

  it('reports duplicated roles for a selected formation', () => {
    expect(deriveTeamView(player, ['hero-a', 'hero-b']).duplicateRoles).toEqual(['fighter']);
  });

  it('guards banners with no cost or pity threshold', () => {
    const unusual = { ...player, banner: { ...player.banner, gemCost: 0, pityThreshold: 0 } };
    expect(derivePlayerView(unusual)).toMatchObject({ affordableSummons: 0, pityPercent: 0 });
  });
});
