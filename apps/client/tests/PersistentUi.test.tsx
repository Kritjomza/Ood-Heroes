import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PlayerBootstrap } from '@odd-tower/network-protocol';
import { HomeScreen } from '../src/ui/persistent/HomeScreen';
import { CollectionScreen } from '../src/ui/persistent/CollectionScreen';

const player: PlayerBootstrap = {
  contractVersion: 1,
  schemaVersion: 1,
  serverTime: '2026-07-31T00:00:00.000Z',
  profile: {
    userId: '10000000-0000-4000-8000-000000000001',
    displayName: 'Odd Tester',
    accountKind: 'guest',
    teamSlots: 1,
    onboardingStep: 0,
  },
  currencies: { gold: 500, gem: 300, upgradeJelly: 0 },
  heroDefinitions: [
    {
      id: 'hero_001_grilled_chicken',
      displayName: 'Grilled Chicken Executioner',
      role: 'fighter',
      rarity: 'common',
      assetKey: 'hero.grilled_chicken.portrait',
    },
  ],
  heroes: [
    {
      id: '20000000-0000-4000-8000-000000000001',
      definitionId: 'hero_001_grilled_chicken',
      totalExperience: 0,
      level: 1,
      stars: 1,
      shards: 0,
    },
  ],
  activeTeam: {
    id: '30000000-0000-4000-8000-000000000001',
    name: 'Main Team',
    slots: [{ slotIndex: 1, playerHeroId: '20000000-0000-4000-8000-000000000001' }],
  },
  banner: {
    id: 'standard_odd_heroes',
    displayName: 'Odd Hero Summon',
    gemCost: 100,
    pityThreshold: 20,
    pullsSinceEpic: 0,
    totalPulls: 0,
  },
  pendingAfkClaim: null,
  persistence: { status: 'healthy', queueDepth: 0 },
};

describe('persistent UI', () => {
  it('shows authoritative currencies and 48px-class feature actions', () => {
    render(
      <HomeScreen
        player={player}
        navigate={vi.fn()}
        onPlayLocal={vi.fn()}
        onPlayOnline={vi.fn()}
      />,
    );
    expect(screen.getByText('Welcome back, Odd Tester')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Your expedition' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enter Floor 1 online' })).toBeInTheDocument();
  });

  it('labels ownership without relying only on rarity color', () => {
    render(<CollectionScreen player={player} back={vi.fn()} selectHero={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: /Grilled Chicken Executioner, owned, level 1/ }),
    ).toBeInTheDocument();
  });
});
