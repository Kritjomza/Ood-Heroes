// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { PlayerBootstrap } from '@odd-tower/network-protocol';
import { HERO_DEFINITIONS } from '@odd-tower/game-core';
import { persistentCombatHeroes } from '../src/rooms/FloorOneRoom';

describe('persistent combat hero initialization', () => {
  it('copies all six definition IDs without deriving identity from combat role', () => {
    const heroes = HERO_DEFINITIONS.map((definition, index) => ({
      id: `owned-${index + 1}`,
      definitionId: definition.id,
      totalExperience: 0,
      level: 1,
      stars: 1,
      shards: 0,
    }));
    const bootstrap = {
      heroes,
      activeTeam: {
        id: 'team',
        name: 'All identities',
        slots: heroes.map((hero, slotIndex) => ({ slotIndex, playerHeroId: hero.id })),
      },
    } as PlayerBootstrap;

    expect(persistentCombatHeroes(bootstrap).map((hero) => hero.definitionId)).toEqual(
      HERO_DEFINITIONS.map((definition) => definition.id),
    );
  });
});
