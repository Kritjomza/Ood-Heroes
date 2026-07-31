import type { PlayerBootstrap } from '@odd-tower/network-protocol';
import type { CombatRewardInput, PlayerPersistenceService } from './persistence-types.js';

export class InMemoryPersistenceService implements PlayerPersistenceService {
  readonly #players = new Map<string, PlayerBootstrap>();

  constructor() {
    if (process.env.NODE_ENV === 'production' && process.env.ODD_TOWER_TEST_MODE !== '1')
      throw new Error('In-memory persistence is test-only');
  }

  seed(bootstrap: PlayerBootstrap) {
    this.#players.set(bootstrap.profile.userId, structuredClone(bootstrap));
  }

  async initialize(userId: string, displayName: string, accountKind: 'guest' | 'permanent') {
    const existing = this.#players.get(userId);
    if (existing) return structuredClone(existing);
    const bootstrap = createTestBootstrap(userId, displayName, accountKind);
    this.seed(bootstrap);
    return structuredClone(bootstrap);
  }

  async bootstrap(userId: string) {
    const value = this.#players.get(userId);
    if (!value) throw new Error('PROFILE_NOT_FOUND');
    return structuredClone(value);
  }

  async updateProfile(userId: string, displayName: string, accountKind: 'guest' | 'permanent') {
    const value = await this.bootstrap(userId);
    value.profile.displayName = displayName;
    value.profile.accountKind = accountKind;
    this.seed(value);
    return value;
  }

  async summon() {
    return {};
  }
  async summonHistory() {
    return [];
  }
  async upgradeStar() {
    return {};
  }
  async updateTeam() {
    return {};
  }
  async unlockTeamSlot() {
    return {};
  }
  async prepareAfkClaim() {
    return null;
  }
  async claimAfkReward() {
    return {};
  }
  async applyCombatReward(userId: string, input: CombatRewardInput) {
    void userId;
    void input;
    return {};
  }
  async updateActivity() {}
  async probe() {
    return true;
  }
}

function createTestBootstrap(
  userId: string,
  displayName: string,
  accountKind: 'guest' | 'permanent',
): PlayerBootstrap {
  return {
    contractVersion: 1,
    schemaVersion: 1,
    serverTime: new Date().toISOString(),
    profile: { userId, displayName, accountKind, teamSlots: 1, onboardingStep: 0 },
    currencies: { gold: 500, gem: 300, upgradeJelly: 0 },
    heroDefinitions: [],
    heroes: [],
    activeTeam: { id: '30000000-0000-4000-8000-000000000001', name: 'Main Team', slots: [] },
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
}
