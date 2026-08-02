import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  validatePlayerBootstrap,
  validateSummonResult,
  type PlayerBootstrap,
} from '@odd-tower/network-protocol';
import type { Database } from '@odd-tower/network-protocol';
import type { PersistenceConfig } from '../config.js';
import { DomainError, mapPersistenceError } from '../api/domainErrors.js';
import type { CombatRewardInput, PlayerPersistenceService } from './persistence-types.js';

export class SupabasePersistenceService implements PlayerPersistenceService {
  readonly #client: SupabaseClient<Database>;

  constructor(config: PersistenceConfig) {
    this.#client = createClient<Database>(config.url, config.secretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  initialize(userId: string, displayName: string, accountKind: 'guest' | 'permanent') {
    return this.#bootstrapRpc('initialize_player_account', {
      p_user_id: userId,
      p_display_name: displayName,
      p_account_kind: accountKind,
    });
  }

  async bootstrap(userId: string) {
    const data = await this.#rpc('get_player_bootstrap', { p_user_id: userId });
    if (data === null) throw new DomainError('PROFILE_NOT_FOUND');
    const validated = validatePlayerBootstrap(data);
    if (!validated.ok) throw new DomainError(validated.code, 503);
    return validated.value;
  }

  updateProfile(userId: string, displayName: string, accountKind: 'guest' | 'permanent') {
    return this.#bootstrapRpc('update_player_profile', {
      p_user_id: userId,
      p_display_name: displayName,
      p_account_kind: accountKind,
    });
  }

  async summon(userId: string, bannerId: string, idempotencyKey: string) {
    const data = await this.#rpc('perform_summon', {
      p_user_id: userId,
      p_banner_id: bannerId,
      p_idempotency_key: idempotencyKey,
    });
    const validated = validateSummonResult(data);
    if (!validated.ok) {
      if (!isLegacySummonResult(data)) throw new DomainError(validated.code, 503);
      const bootstrap = await this.bootstrap(userId);
      const definition = bootstrap.heroDefinitions.find(
        (candidate) => candidate.id === data.heroDefinitionId,
      );
      if (!definition) throw new DomainError('SCHEMA_VERSION_MISMATCH', 503);
      return {
        outcomeType: data.outcomeType,
        heroDefinitionId: data.heroDefinitionId,
        heroDisplayName: definition.displayName,
        heroRarity: definition.rarity,
        shardsAwarded: data.shardsAwarded,
        gemCost: data.gemCost,
        gemBalance: data.gemBalance,
        pityBefore: data.pityBefore,
        pityAfter: data.pityAfter,
        alreadyApplied: false,
      };
    }
    return validated.value;
  }

  async summonHistory(userId: string, limit: number) {
    const result = await this.#rpc('get_summon_history', {
      p_user_id: userId,
      p_limit: limit,
    });
    return Array.isArray(result) ? result : [];
  }

  upgradeStar(userId: string, heroId: string, idempotencyKey: string) {
    return this.#rpc('upgrade_hero_star', {
      p_user_id: userId,
      p_player_hero_id: heroId,
      p_idempotency_key: idempotencyKey,
    });
  }

  updateTeam(userId: string, heroIds: string[], idempotencyKey: string) {
    return this.#rpc('update_active_team', {
      p_user_id: userId,
      p_player_hero_ids: heroIds,
      p_idempotency_key: idempotencyKey,
    });
  }

  unlockTeamSlot(userId: string, idempotencyKey: string) {
    return this.#rpc('unlock_team_slot', {
      p_user_id: userId,
      p_idempotency_key: idempotencyKey,
    });
  }

  prepareAfkClaim(userId: string) {
    return this.#rpc('prepare_afk_claim', { p_user_id: userId });
  }

  claimAfkReward(userId: string, claimId: string, idempotencyKey: string) {
    return this.#rpc('claim_afk_reward', {
      p_user_id: userId,
      p_claim_id: claimId,
      p_idempotency_key: idempotencyKey,
    });
  }

  applyCombatReward(userId: string, input: CombatRewardInput) {
    return this.#rpc('apply_combat_reward', {
      p_user_id: userId,
      p_reward_identity: input.rewardIdentity,
      p_gold: input.gold,
      p_hero_experience: input.heroExperience,
      p_living_hero_ids: input.livingHeroIds,
      p_defeated_hero_ids: input.defeatedHeroIds,
    });
  }

  async updateActivity(userId: string) {
    await this.#rpc('update_player_activity', { p_user_id: userId });
  }

  async probe() {
    try {
      const { error } = await this.#client
        .from('schema_versions')
        .select('version')
        .eq('version', 1)
        .single();
      return error === null;
    } catch {
      return false;
    }
  }

  async #bootstrapRpc(name: string, parameters: Record<string, unknown>): Promise<PlayerBootstrap> {
    const data = await this.#rpc(name, parameters);
    const validated = validatePlayerBootstrap(data);
    if (!validated.ok) throw new DomainError(validated.code, 503);
    return validated.value;
  }

  async #rpc(name: string, parameters: Record<string, unknown>) {
    try {
      const { data, error } = await this.#client.rpc(name as never, parameters as never);
      if (error) throw error;
      return data as unknown;
    } catch (error) {
      throw mapPersistenceError(error);
    }
  }
}

function isLegacySummonResult(value: unknown): value is {
  outcomeType: 'new_hero' | 'duplicate';
  heroDefinitionId: string;
  shardsAwarded: number;
  gemCost: number;
  gemBalance: number;
  pityBefore: number;
  pityAfter: number;
} {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    (candidate.outcomeType === 'new_hero' || candidate.outcomeType === 'duplicate') &&
    typeof candidate.heroDefinitionId === 'string' &&
    ['shardsAwarded', 'gemCost', 'gemBalance', 'pityBefore', 'pityAfter'].every(
      (key) => Number.isSafeInteger(candidate[key]) && (candidate[key] as number) >= 0,
    )
  );
}
