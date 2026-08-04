-- Durable MMO progression and reward mutations.
-- All writes go through service-role RPCs; player reads are ownership-scoped.

create table public.mmo_account_progression (
  account_id uuid primary key references public.profiles(user_id) on delete cascade,
  adventure_rank smallint not null default 1 check (adventure_rank between 1 and 20),
  adventure_experience bigint not null default 0 check (adventure_experience >= 0),
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now()
);

create table public.mmo_hero_progression (
  account_id uuid not null references public.profiles(user_id) on delete cascade,
  hero_id text not null check (char_length(hero_id) between 1 and 128),
  level smallint not null default 1 check (level between 1 and 100),
  experience bigint not null default 0 check (experience >= 0),
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now(),
  primary key (account_id, hero_id)
);

create index mmo_hero_progression_account_idx
  on public.mmo_hero_progression (account_id, hero_id);

create table public.mmo_reward_ledger (
  reward_identity text primary key check (char_length(reward_identity) between 1 and 256),
  account_id uuid not null references public.profiles(user_id) on delete cascade,
  status text not null check (status in ('pending', 'committed')),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  prepared_at timestamptz not null default now(),
  committed_at timestamptz,
  check ((status = 'pending' and committed_at is null) or (status = 'committed' and committed_at is not null))
);

create index mmo_reward_ledger_account_idx
  on public.mmo_reward_ledger (account_id, prepared_at desc);

alter table public.mmo_account_progression enable row level security;
alter table public.mmo_hero_progression enable row level security;
alter table public.mmo_reward_ledger enable row level security;

create policy "Players can read their MMO account progression"
on public.mmo_account_progression for select to authenticated
using ((select auth.uid()) = account_id);

create policy "Players can read their MMO hero progression"
on public.mmo_hero_progression for select to authenticated
using ((select auth.uid()) = account_id);

create policy "Players can read their MMO reward ledger"
on public.mmo_reward_ledger for select to authenticated
using ((select auth.uid()) = account_id);

revoke all on table public.mmo_account_progression from public, anon, authenticated;
revoke all on table public.mmo_hero_progression from public, anon, authenticated;
revoke all on table public.mmo_reward_ledger from public, anon, authenticated;
grant select on table public.mmo_account_progression to authenticated;
grant select on table public.mmo_hero_progression to authenticated;
grant select on table public.mmo_reward_ledger to authenticated;
grant select, insert, update, delete on table public.mmo_account_progression to service_role;
grant select, insert, update, delete on table public.mmo_hero_progression to service_role;
grant select, insert, update, delete on table public.mmo_reward_ledger to service_role;

create or replace function public.save_mmo_progression(
  p_account_id uuid,
  p_adventure_rank smallint,
  p_adventure_experience bigint,
  p_revision bigint,
  p_heroes jsonb,
  p_updated_at timestamptz default now()
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  account_rows integer;
  hero jsonb;
begin
  if jsonb_typeof(p_heroes) <> 'array' then
    raise exception 'heroes_must_be_array';
  end if;

  insert into public.mmo_account_progression (
    account_id, adventure_rank, adventure_experience, revision, updated_at
  ) values (
    p_account_id, p_adventure_rank, p_adventure_experience, p_revision, p_updated_at
  )
  on conflict (account_id) do update
    set adventure_rank = excluded.adventure_rank,
        adventure_experience = excluded.adventure_experience,
        revision = excluded.revision,
        updated_at = excluded.updated_at
    where public.mmo_account_progression.revision < excluded.revision;

  get diagnostics account_rows = row_count;
  if account_rows = 0 then
    return false;
  end if;

  for hero in select value from jsonb_array_elements(p_heroes)
  loop
    insert into public.mmo_hero_progression (
      account_id, hero_id, level, experience, revision, updated_at
    ) values (
      p_account_id,
      hero->>'id',
      (hero->>'level')::smallint,
      (hero->>'experience')::bigint,
      p_revision,
      p_updated_at
    )
    on conflict (account_id, hero_id) do update
      set level = excluded.level,
          experience = excluded.experience,
          revision = excluded.revision,
          updated_at = excluded.updated_at
      where public.mmo_hero_progression.revision < excluded.revision;
  end loop;
  return true;
end;
$$;

create or replace function public.prepare_mmo_reward(
  p_reward_identity text,
  p_account_id uuid,
  p_payload jsonb,
  p_prepared_at timestamptz default now()
)
returns public.mmo_reward_ledger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  result public.mmo_reward_ledger;
begin
  insert into public.mmo_reward_ledger (reward_identity, account_id, status, payload, prepared_at)
  values (p_reward_identity, p_account_id, 'pending', p_payload, p_prepared_at)
  on conflict (reward_identity) do nothing;
  select * into result from public.mmo_reward_ledger where reward_identity = p_reward_identity;
  return result;
end;
$$;

create or replace function public.commit_mmo_reward(
  p_reward_identity text,
  p_committed_at timestamptz default now()
)
returns public.mmo_reward_ledger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  result public.mmo_reward_ledger;
begin
  update public.mmo_reward_ledger
    set status = 'committed', committed_at = coalesce(committed_at, p_committed_at)
    where reward_identity = p_reward_identity and status = 'pending';
  select * into result from public.mmo_reward_ledger where reward_identity = p_reward_identity;
  return result;
end;
$$;

revoke all on function public.save_mmo_progression(uuid, smallint, bigint, bigint, jsonb, timestamptz)
  from public, anon, authenticated;
revoke all on function public.prepare_mmo_reward(text, uuid, jsonb, timestamptz)
  from public, anon, authenticated;
revoke all on function public.commit_mmo_reward(text, timestamptz)
  from public, anon, authenticated;
grant execute on function public.save_mmo_progression(uuid, smallint, bigint, bigint, jsonb, timestamptz)
  to service_role;
grant execute on function public.prepare_mmo_reward(text, uuid, jsonb, timestamptz)
  to service_role;
grant execute on function public.commit_mmo_reward(text, timestamptz)
  to service_role;
