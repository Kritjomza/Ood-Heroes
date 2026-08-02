// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const rpc = vi.hoisted(() => vi.fn());
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({ rpc }),
}));

import { SupabasePersistenceService } from '../src/persistence/SupabasePersistenceService';

const service = new SupabasePersistenceService({
  url: 'https://project.example.test',
  publishableKey: 'publishable-test-value',
  secretKey: 'secret-test-value',
  issuer: 'https://project.example.test/auth/v1',
});

describe('SupabasePersistenceService bootstrap failures', () => {
  beforeEach(() => rpc.mockReset());

  it('classifies a missing player profile as not found instead of unavailable', async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await expect(service.bootstrap('10000000-0000-4000-8000-000000000001')).rejects.toMatchObject({
      code: 'PROFILE_NOT_FOUND',
      status: 404,
    });
  });

  it('classifies a database/RPC failure as persistence unavailable', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'connection unavailable' } });
    await expect(service.bootstrap('10000000-0000-4000-8000-000000000001')).rejects.toMatchObject({
      code: 'PERSISTENCE_UNAVAILABLE',
      status: 503,
    });
  });

  it('returns only a validated summon result and fails closed on malformed RPC data', async () => {
    rpc.mockResolvedValueOnce({ data: { outcomeType: 'new_hero' }, error: null });
    await expect(
      service.summon(
        '10000000-0000-4000-8000-000000000001',
        'standard_odd_heroes',
        '20000000-0000-4000-8000-000000000001',
      ),
    ).rejects.toMatchObject({ code: 'SCHEMA_VERSION_MISMATCH', status: 503 });
  });

  it('normalizes the legacy summon RPC during a rolling database migration', async () => {
    rpc
      .mockResolvedValueOnce({
        data: {
          outcomeType: 'duplicate',
          heroDefinitionId: 'hero_006_samurai_bread',
          shardsAwarded: 60,
          gemCost: 100,
          gemBalance: 200,
          pityBefore: 4,
          pityAfter: 5,
          hero: { id: '30000000-0000-4000-8000-000000000001' },
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          contractVersion: 1,
          schemaVersion: 1,
          serverTime: '2026-08-02T00:00:00.000Z',
          profile: {
            userId: '10000000-0000-4000-8000-000000000001',
            displayName: 'Odd',
            accountKind: 'guest',
            teamSlots: 1,
            onboardingStep: 0,
          },
          currencies: { gold: 0, gem: 200, upgradeJelly: 0 },
          heroDefinitions: [
            {
              id: 'hero_006_samurai_bread',
              displayName: 'Samurai Bread',
              role: 'fighter',
              rarity: 'legendary',
              assetKey: 'hero.samurai',
            },
          ],
          heroes: [],
          activeTeam: { id: '40000000-0000-4000-8000-000000000001', name: 'Main', slots: [] },
          banner: {
            id: 'standard_odd_heroes',
            displayName: 'Odd Hero Summon',
            gemCost: 100,
            pityThreshold: 20,
            pullsSinceEpic: 5,
            totalPulls: 1,
          },
          pendingAfkClaim: null,
          persistence: { status: 'healthy', queueDepth: 0 },
        },
        error: null,
      });

    await expect(
      service.summon(
        '10000000-0000-4000-8000-000000000001',
        'standard_odd_heroes',
        '20000000-0000-4000-8000-000000000001',
      ),
    ).resolves.toMatchObject({
      outcomeType: 'duplicate',
      heroDisplayName: 'Samurai Bread',
      heroRarity: 'legendary',
      alreadyApplied: false,
    });
  });
});
