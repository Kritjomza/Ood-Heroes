// @vitest-environment node
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@odd-tower/network-protocol';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SupabasePersistenceService } from '../src/persistence/SupabasePersistenceService';

const configured = Boolean(
  process.env.SUPABASE_URL &&
    process.env.SUPABASE_PUBLISHABLE_KEY &&
    process.env.SUPABASE_SECRET_KEY,
);
const suite = configured ? describe : describe.skip;
const userId = crypto.randomUUID();
let service: SupabasePersistenceService;
let admin: SupabaseClient<Database>;

suite('local Supabase persistence integration', () => {
  beforeAll(async () => {
    const config = {
      url: process.env.SUPABASE_URL!,
      publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY!,
      secretKey: process.env.SUPABASE_SECRET_KEY!,
      issuer: `${process.env.SUPABASE_URL!}/auth/v1`,
    };
    admin = createClient<Database>(config.url, config.secretKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await admin.auth.admin.createUser({
      id: userId,
      email: `phase4-${userId}@example.test`,
      email_confirm: true,
      password: 'OddTower-Test-Password-42!',
    });
    if (error) throw error;
    service = new SupabasePersistenceService(config);
  });

  afterAll(async () => {
    if (!configured) return;
    const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    await admin.auth.admin.deleteUser(userId);
  });

  it('initializes once, restores schema-versioned data, and replays a Summon key', async () => {
    const first = await service.initialize(userId, 'Database Oddity', 'permanent');
    const replay = await service.initialize(userId, 'Ignored Name', 'permanent');
    expect(first.profile.displayName).toBe('Database Oddity');
    expect(replay.heroes).toHaveLength(1);
    expect(replay.currencies).toEqual({ gold: 500, gem: 300, upgradeJelly: 0 });
    const key = crypto.randomUUID();
    const summon = await service.summon(userId, first.banner.id, key);
    const sameSummon = await service.summon(userId, first.banner.id, key);
    expect(sameSummon).toEqual(summon);
    const afterRestart = new SupabasePersistenceService({
      url: process.env.SUPABASE_URL!,
      publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY!,
      secretKey: process.env.SUPABASE_SECRET_KEY!,
      issuer: `${process.env.SUPABASE_URL!}/auth/v1`,
    });
    expect((await afterRestart.bootstrap(userId)).currencies.gem).toBe(200);
  });

  it('denies protected RPC execution to the publishable browser role', async () => {
    const browser = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await browser.rpc('perform_summon', {
      p_user_id: userId,
      p_banner_id: 'standard_odd_heroes',
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(error).not.toBeNull();
  });

  it('repairs incomplete player aggregate state idempotently', async () => {
    await service.initialize(userId, 'Database Oddity', 'permanent');
    const team = await admin
      .from('player_teams')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();
    if (team.error) throw team.error;
    const deletions = await Promise.all([
      admin.from('player_currencies').delete().eq('user_id', userId).eq('currency_code', 'gold'),
      admin.from('team_members').delete().eq('team_id', team.data.id),
      admin.from('player_summon_state').delete().eq('user_id', userId),
      admin.from('afk_state').delete().eq('user_id', userId),
    ]);
    for (const deletion of deletions) if (deletion.error) throw deletion.error;

    const repaired = await service.initialize(userId, 'Ignored Name', 'permanent');

    expect(repaired.currencies).toEqual({ gold: 500, gem: 200, upgradeJelly: 0 });
    expect(repaired.activeTeam.slots).toHaveLength(1);
    expect(repaired.banner.id).toBe('standard_odd_heroes');
  });
});
