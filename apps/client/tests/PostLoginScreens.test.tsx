import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PlayerBootstrap } from '@odd-tower/network-protocol';
import { HomeScreen } from '../src/ui/persistent/HomeScreen';
import { CollectionScreen } from '../src/ui/persistent/CollectionScreen';
import { HeroDetailScreen } from '../src/ui/persistent/HeroDetailScreen';
import { SummonScreen } from '../src/ui/persistent/SummonScreen';
import { TeamBuilderScreen } from '../src/ui/persistent/TeamBuilderScreen';
import { AfkRewardModal } from '../src/ui/persistent/AfkRewardModal';
import { PersistenceStatus } from '../src/ui/persistent/PersistenceStatus';

export const postLoginPlayer: PlayerBootstrap = {
  contractVersion: 1,
  schemaVersion: 1,
  serverTime: '2026-08-02T00:00:00Z',
  profile: {
    userId: 'user-1',
    displayName: 'Mali',
    accountKind: 'guest',
    teamSlots: 2,
    onboardingStep: 0,
  },
  currencies: { gold: 500, gem: 300, upgradeJelly: 4 },
  heroDefinitions: [
    {
      id: 'chicken',
      displayName: 'Grilled Chicken Executioner',
      role: 'fighter',
      rarity: 'common',
      assetKey: 'hero.grilled_chicken.portrait',
    },
    {
      id: 'tofu',
      displayName: 'Tofu Rabbit',
      role: 'healer',
      rarity: 'rare',
      assetKey: 'hero.tofu_rabbit.portrait',
    },
  ],
  heroes: [
    {
      id: 'owned-1',
      definitionId: 'chicken',
      totalExperience: 120,
      level: 4,
      stars: 2,
      shards: 999,
    },
  ],
  activeTeam: { id: 'team', name: 'Main Team', slots: [{ slotIndex: 1, playerHeroId: 'owned-1' }] },
  banner: {
    id: 'banner',
    displayName: 'Odd Hero Summon',
    gemCost: 100,
    pityThreshold: 20,
    pullsSinceEpic: 5,
    totalPulls: 5,
  },
  pendingAfkClaim: null,
  persistence: { status: 'healthy', queueDepth: 0 },
};

describe('Pocket Adventure post-login screens', () => {
  it('organizes Home around the expedition and derived progress', () => {
    render(
      <HomeScreen
        player={postLoginPlayer}
        navigate={vi.fn()}
        onPlayLocal={vi.fn()}
        onPlayOnline={vi.fn()}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Welcome back, Mali' })).toBeInTheDocument();
    expect(screen.getByText('1 of 2 heroes')).toBeInTheDocument();
    expect(screen.getByText('3 summons ready')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enter Floor 1 online' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'View mission briefing' }));
    expect(screen.getByRole('dialog', { name: /Floor 01/u })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enter tower' })).toBeInTheDocument();
  });

  it('presents the collection as a filterable sticker album', () => {
    render(<CollectionScreen player={postLoginPlayer} back={vi.fn()} selectHero={vi.fn()} />);
    expect(screen.getByText('50% collected')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'fighter filter' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Grilled Chicken Executioner, owned, level 4/i }),
    ).toBeInTheDocument();
  });

  it('shows authoritative hero progression without an invented XP target', () => {
    render(
      <HeroDetailScreen
        player={postLoginPlayer}
        heroId="owned-1"
        back={vi.fn()}
        upgrade={vi.fn()}
        busy={false}
      />,
    );
    expect(screen.getByText('999 shards')).toBeInTheDocument();
    expect(screen.getByText('Active slot 1')).toBeInTheDocument();
    expect(screen.queryByText(/22,864/)).not.toBeInTheDocument();
  });

  it('shows affordable pulls and starts reveal only after a server result', async () => {
    const summon = vi.fn().mockResolvedValue({
      outcomeType: 'duplicate',
      heroDefinitionId: 'hero_006_samurai_bread',
      heroDisplayName: 'Samurai Bread',
      heroRarity: 'legendary',
      shardsAwarded: 60,
      gemCost: 100,
      gemBalance: 200,
      pityBefore: 5,
      pityAfter: 0,
      alreadyApplied: false,
    });
    render(
      <SummonScreen
        player={postLoginPlayer}
        back={vi.fn()}
        busy={false}
        result={null}
        summon={summon}
      />,
    );
    expect(screen.getByText('3 pulls available')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Epic guarantee progress' })).toHaveAttribute(
      'aria-valuenow',
      '5',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Summon for 100 gems' }));
    expect(summon).toHaveBeenCalledOnce();
    expect(await screen.findByRole('heading', { name: 'Samurai Bread' })).toBeInTheDocument();
    expect(screen.getByText('Duplicate · +60 shards')).toBeInTheDocument();
  });

  it('shows formation-derived information and protects unchanged teams', () => {
    render(
      <TeamBuilderScreen
        player={postLoginPlayer}
        back={vi.fn()}
        save={vi.fn()}
        unlock={vi.fn()}
        busy={false}
      />,
    );
    expect(screen.getByText('Average level')).toBeInTheDocument();
    expect(screen.getByText('Total stars')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save formation' })).toBeDisabled();
  });

  it('itemizes the AFK parcel and explains queued save changes', () => {
    const { rerender } = render(<PersistenceStatus status="degraded" queueDepth={2} />);
    expect(screen.getByRole('status')).toHaveTextContent('Save paused · 2 changes waiting');
    rerender(
      <AfkRewardModal
        claim={{
          id: '2f1d0b98-7310-4f9b-b1aa-7d5f43a9bc9d',
          rewardedMinutes: 30,
          periodStart: '2026-07-31T00:00:00.000Z',
          periodEnd: '2026-07-31T00:30:00.000Z',
          gold: 250,
          diamonds: 35,
          shardsPerActiveHero: 10,
          recipientHeroIds: ['9b2a5b7e-6c30-4d44-9d4f-c286bf5f5d38'],
        }}
        busy={false}
        close={vi.fn()}
        collect={vi.fn()}
      />,
    );
    expect(screen.getByRole('dialog', { name: 'While you were away' })).toHaveTextContent(
      '250 Gold',
    );
    expect(screen.getByText('35 Diamonds')).toBeInTheDocument();
    expect(screen.getByText('10 Shards per active hero')).toBeInTheDocument();
    expect(screen.getByText(/30-minute maximum reached/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Collect rewards' })).toBeInTheDocument();
  });
});
