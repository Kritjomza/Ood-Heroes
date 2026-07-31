import type { PlayerBootstrap } from '@odd-tower/network-protocol';

export type CombatRewardInput = {
  rewardIdentity: string;
  gold: number;
  heroExperience: number;
  livingHeroIds: string[];
  defeatedHeroIds: string[];
};

export interface PlayerPersistenceService {
  initialize(
    userId: string,
    displayName: string,
    accountKind: 'guest' | 'permanent',
  ): Promise<PlayerBootstrap>;
  bootstrap(userId: string): Promise<PlayerBootstrap>;
  updateProfile(
    userId: string,
    displayName: string,
    accountKind: 'guest' | 'permanent',
  ): Promise<PlayerBootstrap>;
  summon(userId: string, bannerId: string, idempotencyKey: string): Promise<unknown>;
  summonHistory(userId: string, limit: number): Promise<unknown[]>;
  upgradeStar(userId: string, heroId: string, idempotencyKey: string): Promise<unknown>;
  updateTeam(userId: string, heroIds: string[], idempotencyKey: string): Promise<unknown>;
  unlockTeamSlot(userId: string, idempotencyKey: string): Promise<unknown>;
  prepareAfkClaim(userId: string): Promise<unknown>;
  claimAfkReward(userId: string, claimId: string, idempotencyKey: string): Promise<unknown>;
  applyCombatReward(userId: string, input: CombatRewardInput): Promise<unknown>;
  updateActivity(userId: string): Promise<void>;
  probe(): Promise<boolean>;
}
