import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@odd-tower/network-protocol';
import type { AdventureProgress, MmoHeroProgress } from '@odd-tower/game-core';

export type MmoProgression = {
  accountId: string;
  adventure: AdventureProgress;
  heroes: MmoHeroProgress[];
  revision: number;
  updatedAt: string;
};

export interface MmoProgressionRepository {
  load(accountId: string): Promise<MmoProgression | null>;
  saveIfNewer(progression: MmoProgression): Promise<'saved' | 'stale'>;
}

export class SupabaseMmoProgressionRepository implements MmoProgressionRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async load(accountId: string): Promise<MmoProgression | null> {
    const [account, heroes] = await Promise.all([
      this.client
        .from('mmo_account_progression')
        .select('account_id, adventure_rank, adventure_experience, revision, updated_at')
        .eq('account_id', accountId)
        .maybeSingle(),
      this.client
        .from('mmo_hero_progression')
        .select('account_id, hero_id, level, experience, revision, updated_at')
        .eq('account_id', accountId)
        .order('hero_id', { ascending: true }),
    ]);
    if (account.error) throw account.error;
    if (heroes.error) throw heroes.error;
    if (!account.data) return null;
    return parseProgression({
      accountId: account.data.account_id,
      adventure: { rank: account.data.adventure_rank, experience: account.data.adventure_experience },
      heroes: heroes.data.map((hero) => ({ id: hero.hero_id, level: hero.level, experience: hero.experience })),
      revision: account.data.revision,
      updatedAt: account.data.updated_at,
    });
  }

  async saveIfNewer(progression: MmoProgression): Promise<'saved' | 'stale'> {
    const valid = parseProgression(progression);
    const { data, error } = await this.client.rpc('save_mmo_progression', {
      p_account_id: valid.accountId,
      p_adventure_rank: valid.adventure.rank,
      p_adventure_experience: valid.adventure.experience,
      p_revision: valid.revision,
      p_heroes: valid.heroes as unknown as Json,
      p_updated_at: valid.updatedAt,
    });
    if (error) throw error;
    return data ? 'saved' : 'stale';
  }
}

function parseProgression(value: unknown): MmoProgression {
  if (!isRecord(value) || !isRecord(value.adventure) || !Array.isArray(value.heroes)) invalid();
  const accountId = boundedString(value.accountId, 128);
  const adventure = {
    rank: boundedInteger(value.adventure.rank, 1, 20),
    experience: boundedInteger(value.adventure.experience, 0, Number.MAX_SAFE_INTEGER),
  } satisfies AdventureProgress;
  const heroes = value.heroes.map((hero) => {
    if (!isRecord(hero)) invalid();
    return {
      id: boundedString(hero.id, 128),
      level: boundedInteger(hero.level, 1, 100),
      experience: boundedInteger(hero.experience, 0, Number.MAX_SAFE_INTEGER),
    } satisfies MmoHeroProgress;
  });
  const revision = boundedInteger(value.revision, 0, Number.MAX_SAFE_INTEGER);
  if (
    typeof value.updatedAt !== 'string' ||
    !Number.isFinite(Date.parse(value.updatedAt)) ||
    new Date(value.updatedAt).toISOString() !== value.updatedAt
  ) invalid();
  return { accountId, adventure, heroes, revision, updatedAt: value.updatedAt };
}

function boundedString(value: unknown, max: number): string {
  if (typeof value !== 'string' || value.length < 1 || value.length > max) invalid();
  return value;
}

function boundedInteger(value: unknown, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max) invalid();
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function invalid(): never {
  throw new Error('invalid_mmo_progression');
}
