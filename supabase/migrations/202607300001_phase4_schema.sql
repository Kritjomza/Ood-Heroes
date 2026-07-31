create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.schema_versions (
  version integer primary key check (version > 0),
  applied_at timestamptz not null default now()
);

insert into public.schema_versions (version) values (1);

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name varchar(20) not null
    check (display_name = btrim(display_name))
    check (char_length(display_name) between 1 and 20)
    check (display_name !~ '[[:cntrl:]]'),
  account_kind text not null check (account_kind in ('guest', 'permanent')),
  team_slots smallint not null default 1 check (team_slots between 1 and 3),
  onboarding_step smallint not null default 0 check (onboarding_step >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table public.hero_definitions (
  id text primary key,
  slug text unique not null,
  display_name text not null,
  role text not null
    check (role in ('fighter', 'tank', 'trickster', 'healer', 'support', 'ranger')),
  rarity text not null check (rarity in ('common', 'rare', 'epic', 'legendary')),
  base_hp integer not null check (base_hp > 0),
  base_attack integer not null check (base_attack > 0),
  base_defense integer not null check (base_defense >= 0),
  move_speed integer not null check (move_speed > 0),
  attack_range integer not null check (attack_range > 0),
  attack_cooldown_ms integer not null check (attack_cooldown_ms > 0),
  summon_weight integer not null check (summon_weight > 0),
  duplicate_shards integer not null check (duplicate_shards > 0),
  starter_eligible boolean not null default false,
  asset_key text not null,
  enabled boolean not null default true,
  sort_order integer not null check (sort_order > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.player_heroes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  hero_definition_id text not null references public.hero_definitions(id),
  total_experience integer not null default 0 check (total_experience between 0 and 22864),
  stars smallint not null default 1 check (stars between 1 and 5),
  shards integer not null default 0 check (shards between 0 and 2147483647),
  acquired_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, hero_definition_id)
);

create table public.player_currencies (
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  currency_code text not null check (currency_code in ('gold', 'gem', 'upgrade_jelly')),
  balance integer not null default 0 check (balance between 0 and 2147483647),
  updated_at timestamptz not null default now(),
  primary key (user_id, currency_code)
);

create table public.player_teams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  name varchar(30) not null default 'Main Team'
    check (name = btrim(name))
    check (char_length(name) between 1 and 30)
    check (name !~ '[[:cntrl:]]'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.team_members (
  team_id uuid not null references public.player_teams(id) on delete cascade,
  slot_index smallint not null check (slot_index between 1 and 3),
  player_hero_id uuid not null references public.player_heroes(id) on delete cascade,
  primary key (team_id, slot_index),
  unique (team_id, player_hero_id)
);

create table public.summon_banners (
  id text primary key,
  display_name text not null,
  gem_cost integer not null check (gem_cost > 0),
  pity_threshold integer not null check (pity_threshold > 0),
  enabled boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table public.summon_pool_entries (
  banner_id text not null references public.summon_banners(id) on delete cascade,
  hero_definition_id text not null references public.hero_definitions(id),
  weight integer not null check (weight > 0),
  primary key (banner_id, hero_definition_id)
);

create table public.player_summon_state (
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  banner_id text not null references public.summon_banners(id) on delete cascade,
  pulls_since_epic integer not null default 0 check (pulls_since_epic >= 0),
  total_pulls integer not null default 0 check (total_pulls >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, banner_id)
);

create table public.summon_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  banner_id text not null references public.summon_banners(id),
  hero_definition_id text not null references public.hero_definitions(id),
  outcome_type text not null check (outcome_type in ('new_hero', 'duplicate')),
  shards_awarded integer not null default 0 check (shards_awarded >= 0),
  gem_cost integer not null check (gem_cost > 0),
  pity_before integer not null check (pity_before >= 0),
  pity_after integer not null check (pity_after >= 0),
  idempotency_key uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

create table public.reward_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  reward_identity text not null check (char_length(reward_identity) between 1 and 200),
  source_type text not null check (source_type in ('combat', 'afk', 'starter', 'tutorial')),
  reward_payload jsonb not null,
  source_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, reward_identity)
);

create table public.afk_state (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  last_activity_at timestamptz not null default now(),
  last_settled_at timestamptz not null default now(),
  rate_version integer not null default 1 check (rate_version > 0),
  updated_at timestamptz not null default now()
);

create table public.afk_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  period_start timestamptz not null,
  period_end timestamptz not null,
  interval_count integer not null check (interval_count between 1 and 16),
  reward_payload jsonb not null,
  status text not null check (status in ('pending', 'claimed')),
  prepared_at timestamptz not null default now(),
  claimed_at timestamptz,
  claim_idempotency_key uuid,
  unique (user_id, period_start, period_end),
  check (period_end > period_start),
  check (
    (status = 'pending' and claimed_at is null)
    or (status = 'claimed' and claimed_at is not null)
  )
);

create index profiles_last_seen_at_idx on public.profiles (last_seen_at);
create index player_heroes_user_id_idx on public.player_heroes (user_id);
create index player_heroes_user_definition_idx
  on public.player_heroes (user_id, hero_definition_id);
create index player_teams_user_id_idx on public.player_teams (user_id);
create unique index player_teams_one_active_idx
  on public.player_teams (user_id)
  where is_active;
create index team_members_player_hero_id_idx on public.team_members (player_hero_id);
create index summon_history_user_created_at_idx
  on public.summon_history (user_id, created_at desc);
create index reward_ledger_user_created_at_idx
  on public.reward_ledger (user_id, created_at desc);
create index reward_ledger_reward_identity_idx on public.reward_ledger (reward_identity);
create index afk_claims_user_status_idx on public.afk_claims (user_id, status);
create unique index afk_claims_claim_idempotency_idx
  on public.afk_claims (user_id, claim_idempotency_key)
  where claim_idempotency_key is not null;

create function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog
as $$
begin
  new.updated_at = statement_timestamp();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();
create trigger hero_definitions_set_updated_at
before update on public.hero_definitions
for each row execute function private.set_updated_at();
create trigger player_heroes_set_updated_at
before update on public.player_heroes
for each row execute function private.set_updated_at();
create trigger player_currencies_set_updated_at
before update on public.player_currencies
for each row execute function private.set_updated_at();
create trigger player_teams_set_updated_at
before update on public.player_teams
for each row execute function private.set_updated_at();
create trigger summon_banners_set_updated_at
before update on public.summon_banners
for each row execute function private.set_updated_at();
create trigger player_summon_state_set_updated_at
before update on public.player_summon_state
for each row execute function private.set_updated_at();
create trigger afk_state_set_updated_at
before update on public.afk_state
for each row execute function private.set_updated_at();

revoke all on function private.set_updated_at() from public, anon, authenticated;
