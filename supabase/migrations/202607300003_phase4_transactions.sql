create table private.mutation_results (
  user_id uuid not null references auth.users(id) on delete cascade,
  operation text not null,
  idempotency_key uuid not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, operation, idempotency_key)
);
create function private.level_from_total_experience(p_total integer)
returns integer
language plpgsql
immutable
strict
set search_path = pg_catalog
as $$
declare
  v_level integer := 1;
  v_remaining integer := least(p_total, 22864);
  v_required integer;
begin
  while v_level < 20 loop
    v_required := floor(50 * power(v_level, 1.35))::integer;
    exit when v_remaining < v_required;
    v_remaining := v_remaining - v_required;
    v_level := v_level + 1;
  end loop;
  return v_level;
end;
$$;
create function private.player_bootstrap(p_user_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select jsonb_build_object(
    'contractVersion', 1,
    'schemaVersion', (select max(version) from public.schema_versions),
    'serverTime', clock_timestamp(),
    'profile', jsonb_build_object(
      'userId', p.user_id,
      'displayName', p.display_name,
      'accountKind', p.account_kind,
      'teamSlots', p.team_slots,
      'onboardingStep', p.onboarding_step
    ),
    'currencies', jsonb_build_object(
      'gold', coalesce((select balance from public.player_currencies
        where user_id = p_user_id and currency_code = 'gold'), 0),
      'gem', coalesce((select balance from public.player_currencies
        where user_id = p_user_id and currency_code = 'gem'), 0),
      'upgradeJelly', coalesce((select balance from public.player_currencies
        where user_id = p_user_id and currency_code = 'upgrade_jelly'), 0)
    ),
    'heroDefinitions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', hd.id,
        'displayName', hd.display_name,
        'role', hd.role,
        'rarity', hd.rarity,
        'assetKey', hd.asset_key
      ) order by hd.sort_order)
      from public.hero_definitions hd where hd.enabled
    ), '[]'::jsonb),
    'heroes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', ph.id,
        'definitionId', ph.hero_definition_id,
        'totalExperience', ph.total_experience,
        'level', private.level_from_total_experience(ph.total_experience),
        'stars', ph.stars,
        'shards', ph.shards
      ) order by ph.acquired_at, ph.id)
      from public.player_heroes ph where ph.user_id = p_user_id
    ), '[]'::jsonb),
    'activeTeam', (
      select jsonb_build_object(
        'id', pt.id,
        'name', pt.name,
        'slots', coalesce((
          select jsonb_agg(jsonb_build_object(
            'slotIndex', tm.slot_index,
            'playerHeroId', tm.player_hero_id
          ) order by tm.slot_index)
          from public.team_members tm where tm.team_id = pt.id
        ), '[]'::jsonb)
      )
      from public.player_teams pt
      where pt.user_id = p_user_id and pt.is_active
    ),
    'banner', (
      select jsonb_build_object(
        'id', sb.id,
        'displayName', sb.display_name,
        'gemCost', sb.gem_cost,
        'pityThreshold', sb.pity_threshold,
        'pullsSinceEpic', pss.pulls_since_epic,
        'totalPulls', pss.total_pulls
      )
      from public.summon_banners sb
      join public.player_summon_state pss
        on pss.banner_id = sb.id and pss.user_id = p_user_id
      where sb.enabled
      order by sb.id limit 1
    ),
    'pendingAfkClaim', (
      select jsonb_build_object(
        'id', ac.id,
        'intervalCount', ac.interval_count,
        'periodStart', ac.period_start,
        'periodEnd', ac.period_end,
        'gold', (ac.reward_payload ->> 'gold')::integer,
        'heroExperience', (ac.reward_payload ->> 'heroExperience')::integer,
        'upgradeJelly', (ac.reward_payload ->> 'upgradeJelly')::integer
      )
      from public.afk_claims ac
      where ac.user_id = p_user_id and ac.status = 'pending'
      order by ac.prepared_at limit 1
    ),
    'persistence', jsonb_build_object('status', 'healthy', 'queueDepth', 0)
  )
  from public.profiles p
  where p.user_id = p_user_id;
$$;
create function public.initialize_player_account(
  p_user_id uuid,
  p_display_name text,
  p_account_kind text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_starter_definition_id text;
  v_starter_id uuid;
  v_team_id uuid;
begin
  if p_display_name is null
     or p_display_name <> btrim(p_display_name)
     or char_length(p_display_name) not between 1 and 20
     or p_display_name ~ '[[:cntrl:]]' then
    raise exception using errcode = 'P0001', message = 'DISPLAY_NAME_INVALID';
  end if;
  if p_account_kind not in ('guest', 'permanent') then
    raise exception using errcode = 'P0001', message = 'PROFILE_INITIALIZATION_FAILED';
  end if;

  insert into public.profiles (user_id, display_name, account_kind)
  values (p_user_id, p_display_name, p_account_kind)
  on conflict (user_id) do nothing;

  insert into public.player_currencies (user_id, currency_code, balance)
  values
    (p_user_id, 'gold', 500),
    (p_user_id, 'gem', 300),
    (p_user_id, 'upgrade_jelly', 0)
  on conflict (user_id, currency_code) do nothing;

  select hd.id into v_starter_definition_id
  from public.hero_definitions hd
  where hd.starter_eligible and hd.enabled
  order by md5(p_user_id::text || ':' || hd.id)
  limit 1;

  insert into public.player_heroes (user_id, hero_definition_id)
  values (p_user_id, v_starter_definition_id)
  on conflict (user_id, hero_definition_id) do nothing;

  select id into v_starter_id
  from public.player_heroes
  where user_id = p_user_id and hero_definition_id = v_starter_definition_id;

  select id into v_team_id
  from public.player_teams
  where user_id = p_user_id and is_active
  for update;

  if v_team_id is null then
    insert into public.player_teams (user_id)
    values (p_user_id)
    returning id into v_team_id;
  end if;

  insert into public.team_members (team_id, slot_index, player_hero_id)
  values (v_team_id, 1, v_starter_id)
  on conflict (team_id, slot_index) do nothing;

  insert into public.player_summon_state (user_id, banner_id)
  select p_user_id, id from public.summon_banners where enabled
  on conflict (user_id, banner_id) do nothing;

  insert into public.afk_state (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  insert into public.reward_ledger (
    user_id, reward_identity, source_type, reward_payload
  )
  values (
    p_user_id, 'starter:v1', 'starter',
    jsonb_build_object('heroDefinitionId', v_starter_definition_id)
  )
  on conflict (user_id, reward_identity) do nothing;

  return private.player_bootstrap(p_user_id);
exception
  when foreign_key_violation then
    raise exception using errcode = 'P0001', message = 'AUTH_INVALID';
end;
$$;
create function public.get_player_bootstrap(p_user_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select private.player_bootstrap(p_user_id);
$$;
create function public.update_player_profile(
  p_user_id uuid,
  p_display_name text,
  p_account_kind text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  if p_display_name is null
     or p_display_name <> btrim(p_display_name)
     or char_length(p_display_name) not between 1 and 20
     or p_display_name ~ '[[:cntrl:]]' then
    raise exception using errcode = 'P0001', message = 'DISPLAY_NAME_INVALID';
  end if;
  update public.profiles
  set display_name = p_display_name,
      account_kind = case when p_account_kind = 'permanent' then 'permanent' else account_kind end,
      last_seen_at = clock_timestamp()
  where user_id = p_user_id;
  if not found then
    raise exception using errcode = 'P0001', message = 'PROFILE_NOT_FOUND';
  end if;
  return private.player_bootstrap(p_user_id);
end;
$$;
create function public.get_summon_history(
  p_user_id uuid,
  p_limit integer default 20
)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select coalesce(jsonb_agg(to_jsonb(history_row) order by history_row.created_at desc), '[]'::jsonb)
  from (
    select
      id,
      banner_id as "bannerId",
      hero_definition_id as "heroDefinitionId",
      outcome_type as "outcomeType",
      shards_awarded as "shardsAwarded",
      gem_cost as "gemCost",
      pity_before as "pityBefore",
      pity_after as "pityAfter",
      created_at
    from public.summon_history
    where user_id = p_user_id
    order by created_at desc
    limit least(greatest(p_limit, 1), 50)
  ) history_row;
$$;
create function private.summon_result(
  p_user_id uuid,
  p_history_id uuid
)
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select jsonb_build_object(
    'historyId', sh.id,
    'bannerId', sh.banner_id,
    'heroDefinitionId', sh.hero_definition_id,
    'outcomeType', sh.outcome_type,
    'shardsAwarded', sh.shards_awarded,
    'gemCost', sh.gem_cost,
    'gemBalance', (select balance from public.player_currencies
      where user_id = p_user_id and currency_code = 'gem'),
    'pityBefore', sh.pity_before,
    'pityAfter', sh.pity_after,
    'hero', (
      select jsonb_build_object(
        'id', ph.id,
        'definitionId', ph.hero_definition_id,
        'totalExperience', ph.total_experience,
        'level', private.level_from_total_experience(ph.total_experience),
        'stars', ph.stars,
        'shards', ph.shards
      )
      from public.player_heroes ph
      where ph.user_id = p_user_id
        and ph.hero_definition_id = sh.hero_definition_id
    )
  )
  from public.summon_history sh
  where sh.id = p_history_id and sh.user_id = p_user_id;
$$;
create function public.perform_summon(
  p_user_id uuid,
  p_banner_id text,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_history_id uuid;
  v_cost integer;
  v_threshold integer;
  v_balance integer;
  v_pity integer;
  v_total_pulls integer;
  v_total_weight integer;
  v_roll integer;
  v_hero_id text;
  v_rarity text;
  v_shards integer;
  v_owned_id uuid;
  v_outcome text;
  v_pity_after integer;
begin
  select id into v_history_id
  from public.summon_history
  where user_id = p_user_id and idempotency_key = p_idempotency_key;
  if v_history_id is not null then
    return private.summon_result(p_user_id, v_history_id);
  end if;

  select gem_cost, pity_threshold into v_cost, v_threshold
  from public.summon_banners
  where id = p_banner_id and enabled
    and (starts_at is null or starts_at <= clock_timestamp())
    and (ends_at is null or ends_at > clock_timestamp());
  if not found then
    if exists (select 1 from public.summon_banners where id = p_banner_id) then
      raise exception using errcode = 'P0001', message = 'BANNER_DISABLED';
    end if;
    raise exception using errcode = 'P0001', message = 'BANNER_NOT_FOUND';
  end if;

  select balance into v_balance
  from public.player_currencies
  where user_id = p_user_id and currency_code = 'gem'
  for update;
  if v_balance is null or v_balance < v_cost then
    raise exception using errcode = 'P0001', message = 'INSUFFICIENT_GEMS';
  end if;

  insert into public.player_summon_state (user_id, banner_id)
  values (p_user_id, p_banner_id)
  on conflict (user_id, banner_id) do nothing;
  select pulls_since_epic, total_pulls into v_pity, v_total_pulls
  from public.player_summon_state
  where user_id = p_user_id and banner_id = p_banner_id
  for update;

  select sum(spe.weight)::integer into v_total_weight
  from public.summon_pool_entries spe
  join public.hero_definitions hd on hd.id = spe.hero_definition_id
  where spe.banner_id = p_banner_id and hd.enabled
    and (
      v_pity + 1 < v_threshold
      or hd.rarity in ('epic', 'legendary')
    );
  v_roll := floor(random() * v_total_weight)::integer + 1;

  select picked.hero_definition_id, picked.rarity, picked.duplicate_shards
  into v_hero_id, v_rarity, v_shards
  from (
    select
      spe.hero_definition_id,
      hd.rarity,
      hd.duplicate_shards,
      sum(spe.weight) over (order by hd.sort_order) as cumulative_weight
    from public.summon_pool_entries spe
    join public.hero_definitions hd on hd.id = spe.hero_definition_id
    where spe.banner_id = p_banner_id and hd.enabled
      and (
        v_pity + 1 < v_threshold
        or hd.rarity in ('epic', 'legendary')
      )
  ) picked
  where picked.cumulative_weight >= v_roll
  order by picked.cumulative_weight
  limit 1;

  update public.player_currencies
  set balance = balance - v_cost
  where user_id = p_user_id and currency_code = 'gem';

  select id into v_owned_id
  from public.player_heroes
  where user_id = p_user_id and hero_definition_id = v_hero_id
  for update;
  if v_owned_id is null then
    insert into public.player_heroes (user_id, hero_definition_id)
    values (p_user_id, v_hero_id)
    returning id into v_owned_id;
    v_outcome := 'new_hero';
    v_shards := 0;
  else
    update public.player_heroes
    set shards = shards + v_shards
    where id = v_owned_id;
    v_outcome := 'duplicate';
  end if;

  v_pity_after := case
    when v_rarity in ('epic', 'legendary') then 0
    else v_pity + 1
  end;
  update public.player_summon_state
  set pulls_since_epic = v_pity_after, total_pulls = v_total_pulls + 1
  where user_id = p_user_id and banner_id = p_banner_id;

  update public.profiles
  set team_slots = greatest(team_slots, 2)
  where user_id = p_user_id
    and (select count(*) from public.player_heroes where user_id = p_user_id) >= 2;

  insert into public.summon_history (
    user_id, banner_id, hero_definition_id, outcome_type,
    shards_awarded, gem_cost, pity_before, pity_after, idempotency_key
  )
  values (
    p_user_id, p_banner_id, v_hero_id, v_outcome,
    v_shards, v_cost, v_pity, v_pity_after, p_idempotency_key
  )
  returning id into v_history_id;

  return private.summon_result(p_user_id, v_history_id);
end;
$$;
create function public.upgrade_hero_star(
  p_user_id uuid,
  p_player_hero_id uuid,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_result jsonb;
  v_stars integer;
  v_shards integer;
  v_cost integer;
begin
  select result into v_result from private.mutation_results
  where user_id = p_user_id and operation = 'upgrade_star'
    and idempotency_key = p_idempotency_key;
  if v_result is not null then return v_result; end if;

  select stars, shards into v_stars, v_shards
  from public.player_heroes
  where id = p_player_hero_id and user_id = p_user_id
  for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'HERO_NOT_OWNED';
  end if;
  if v_stars >= 5 then
    raise exception using errcode = 'P0001', message = 'HERO_ALREADY_MAX_STARS';
  end if;
  v_cost := (array[20, 50, 100, 200])[v_stars];
  if v_shards < v_cost then
    raise exception using errcode = 'P0001', message = 'INSUFFICIENT_SHARDS';
  end if;

  update public.player_heroes
  set stars = stars + 1, shards = shards - v_cost
  where id = p_player_hero_id
  returning jsonb_build_object(
    'id', id,
    'definitionId', hero_definition_id,
    'totalExperience', total_experience,
    'level', private.level_from_total_experience(total_experience),
    'stars', stars,
    'shards', shards,
    'shardsSpent', v_cost
  ) into v_result;

  insert into private.mutation_results
    (user_id, operation, idempotency_key, result)
  values (p_user_id, 'upgrade_star', p_idempotency_key, v_result);
  return v_result;
end;
$$;
create function public.update_active_team(
  p_user_id uuid,
  p_player_hero_ids uuid[],
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_result jsonb;
  v_team_id uuid;
  v_team_slots integer;
  v_count integer;
begin
  select result into v_result from private.mutation_results
  where user_id = p_user_id and operation = 'update_team'
    and idempotency_key = p_idempotency_key;
  if v_result is not null then return v_result; end if;

  v_count := coalesce(cardinality(p_player_hero_ids), 0);
  if v_count not between 1 and 3
     or (select count(distinct value) from unnest(p_player_hero_ids) value) <> v_count then
    raise exception using errcode = 'P0001', message = 'TEAM_INVALID';
  end if;
  if (select count(*) from public.player_heroes
      where user_id = p_user_id and id = any(p_player_hero_ids)) <> v_count then
    raise exception using errcode = 'P0001', message = 'HERO_NOT_OWNED';
  end if;

  update public.profiles
  set team_slots = greatest(team_slots, 2)
  where user_id = p_user_id
    and (select count(*) from public.player_heroes where user_id = p_user_id) >= 2;
  select team_slots into v_team_slots from public.profiles
  where user_id = p_user_id for update;
  if v_count > v_team_slots then
    raise exception using errcode = 'P0001', message = 'TEAM_SLOT_LOCKED';
  end if;

  select id into v_team_id from public.player_teams
  where user_id = p_user_id and is_active for update;
  delete from public.team_members where team_id = v_team_id;
  insert into public.team_members (team_id, slot_index, player_hero_id)
  select v_team_id, member.ordinality::integer, member.player_hero_id
  from unnest(p_player_hero_ids)
    with ordinality as member(player_hero_id, ordinality);

  select jsonb_build_object(
    'id', pt.id,
    'name', pt.name,
    'slots', (
      select jsonb_agg(jsonb_build_object(
        'slotIndex', tm.slot_index, 'playerHeroId', tm.player_hero_id
      ) order by tm.slot_index)
      from public.team_members tm where tm.team_id = pt.id
    )
  ) into v_result
  from public.player_teams pt where pt.id = v_team_id;

  insert into private.mutation_results
    (user_id, operation, idempotency_key, result)
  values (p_user_id, 'update_team', p_idempotency_key, v_result);
  return v_result;
end;
$$;
create function public.unlock_team_slot(
  p_user_id uuid,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_result jsonb;
  v_slots integer;
  v_gold integer;
begin
  select result into v_result from private.mutation_results
  where user_id = p_user_id and operation = 'unlock_team_slot'
    and idempotency_key = p_idempotency_key;
  if v_result is not null then return v_result; end if;

  select team_slots into v_slots from public.profiles
  where user_id = p_user_id for update;
  if (select count(*) from public.player_heroes where user_id = p_user_id) < 3 then
    raise exception using errcode = 'P0001', message = 'TEAM_SLOT_LOCKED';
  end if;
  if v_slots >= 3 then
    v_result := jsonb_build_object(
      'teamSlots', v_slots,
      'goldBalance', (select balance from public.player_currencies
        where user_id = p_user_id and currency_code = 'gold')
    );
  else
    select balance into v_gold from public.player_currencies
    where user_id = p_user_id and currency_code = 'gold' for update;
    if v_gold < 500 then
      raise exception using errcode = 'P0001', message = 'INSUFFICIENT_GOLD';
    end if;
    update public.player_currencies set balance = balance - 500
    where user_id = p_user_id and currency_code = 'gold'
    returning balance into v_gold;
    update public.profiles set team_slots = 3 where user_id = p_user_id;
    v_result := jsonb_build_object('teamSlots', 3, 'goldBalance', v_gold);
  end if;

  insert into private.mutation_results
    (user_id, operation, idempotency_key, result)
  values (p_user_id, 'unlock_team_slot', p_idempotency_key, v_result);
  return v_result;
end;
$$;
create function public.apply_combat_reward(
  p_user_id uuid,
  p_reward_identity text,
  p_gold integer,
  p_hero_experience integer,
  p_living_hero_ids uuid[],
  p_defeated_hero_ids uuid[]
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_inserted_id uuid;
  v_active_count integer;
  v_submitted_count integer;
  v_gold_balance integer;
begin
  if p_reward_identity is null
     or char_length(p_reward_identity) not between 1 and 200
     or p_gold < 0
     or p_hero_experience < 0 then
    raise exception using errcode = 'P0001', message = 'TEAM_INVALID';
  end if;

  v_submitted_count :=
    coalesce(cardinality(p_living_hero_ids), 0)
    + coalesce(cardinality(p_defeated_hero_ids), 0);
  select count(*)::integer into v_active_count
  from public.team_members tm
  join public.player_teams pt on pt.id = tm.team_id
  where pt.user_id = p_user_id and pt.is_active
    and tm.player_hero_id = any(
      coalesce(p_living_hero_ids, array[]::uuid[])
      || coalesce(p_defeated_hero_ids, array[]::uuid[])
    );
  if v_submitted_count = 0 or v_active_count <> v_submitted_count
     or exists (
       select 1 from unnest(coalesce(p_living_hero_ids, array[]::uuid[])) living
       where living = any(coalesce(p_defeated_hero_ids, array[]::uuid[]))
     ) then
    raise exception using errcode = 'P0001', message = 'TEAM_INVALID';
  end if;

  insert into public.reward_ledger (
    user_id, reward_identity, source_type, reward_payload
  )
  values (
    p_user_id,
    p_reward_identity,
    'combat',
    jsonb_build_object(
      'gold', p_gold,
      'heroExperience', p_hero_experience,
      'livingHeroIds', p_living_hero_ids,
      'defeatedHeroIds', p_defeated_hero_ids
    )
  )
  on conflict (user_id, reward_identity) do nothing
  returning id into v_inserted_id;

  if v_inserted_id is null then
    return jsonb_build_object(
      'rewardIdentity', p_reward_identity,
      'alreadyApplied', true,
      'goldBalance', (select balance from public.player_currencies
        where user_id = p_user_id and currency_code = 'gold')
    );
  end if;

  update public.player_currencies
  set balance = balance + p_gold
  where user_id = p_user_id and currency_code = 'gold'
  returning balance into v_gold_balance;

  update public.player_heroes
  set total_experience = least(22864, total_experience + p_hero_experience)
  where user_id = p_user_id and id = any(coalesce(p_living_hero_ids, array[]::uuid[]));
  update public.player_heroes
  set total_experience = least(
    22864,
    total_experience + floor(p_hero_experience / 2.0)::integer
  )
  where user_id = p_user_id and id = any(coalesce(p_defeated_hero_ids, array[]::uuid[]));

  return jsonb_build_object(
    'rewardIdentity', p_reward_identity,
    'alreadyApplied', false,
    'goldBalance', v_gold_balance,
    'heroes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', ph.id,
        'definitionId', ph.hero_definition_id,
        'totalExperience', ph.total_experience,
        'level', private.level_from_total_experience(ph.total_experience),
        'stars', ph.stars,
        'shards', ph.shards
      ) order by ph.id)
      from public.player_heroes ph
      where ph.user_id = p_user_id
        and ph.id = any(
          coalesce(p_living_hero_ids, array[]::uuid[])
          || coalesce(p_defeated_hero_ids, array[]::uuid[])
        )
    ), '[]'::jsonb)
  );
end;
$$;
create function public.prepare_afk_claim(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_existing public.afk_claims%rowtype;
  v_last_settled timestamptz;
  v_now timestamptz := clock_timestamp();
  v_complete_intervals integer;
  v_interval_count integer;
  v_period_end timestamptz;
  v_claim_id uuid;
  v_payload jsonb;
begin
  select * into v_existing
  from public.afk_claims
  where user_id = p_user_id and status = 'pending'
  order by prepared_at
  limit 1
  for update;
  if found then
    return jsonb_build_object(
      'id', v_existing.id,
      'intervalCount', v_existing.interval_count,
      'periodStart', v_existing.period_start,
      'periodEnd', v_existing.period_end,
      'gold', (v_existing.reward_payload ->> 'gold')::integer,
      'heroExperience', (v_existing.reward_payload ->> 'heroExperience')::integer,
      'upgradeJelly', (v_existing.reward_payload ->> 'upgradeJelly')::integer
    );
  end if;

  select last_settled_at into v_last_settled
  from public.afk_state
  where user_id = p_user_id
  for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'PROFILE_NOT_FOUND';
  end if;

  v_complete_intervals := floor(
    extract(epoch from (v_now - v_last_settled)) / 1800
  )::integer;
  if v_complete_intervals < 1 then return null; end if;
  v_interval_count := least(v_complete_intervals, 16);
  v_period_end := v_now - (
    mod(extract(epoch from (v_now - v_last_settled))::bigint, 1800)
    * interval '1 second'
  );
  v_payload := jsonb_build_object(
    'gold', 50 * v_interval_count,
    'heroExperience', 20 * v_interval_count,
    'upgradeJelly', v_interval_count
  );

  insert into public.afk_claims (
    user_id, period_start, period_end, interval_count, reward_payload, status
  )
  values (
    p_user_id, v_last_settled, v_period_end, v_interval_count, v_payload, 'pending'
  )
  returning id into v_claim_id;
  update public.afk_state
  set last_settled_at = v_period_end
  where user_id = p_user_id;

  return jsonb_build_object(
    'id', v_claim_id,
    'intervalCount', v_interval_count,
    'periodStart', v_last_settled,
    'periodEnd', v_period_end,
    'gold', 50 * v_interval_count,
    'heroExperience', 20 * v_interval_count,
    'upgradeJelly', v_interval_count
  );
end;
$$;
create function public.claim_afk_reward(
  p_user_id uuid,
  p_claim_id uuid,
  p_idempotency_key uuid
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_result jsonb;
  v_claim public.afk_claims%rowtype;
  v_gold integer;
  v_experience integer;
  v_jelly integer;
  v_gold_balance integer;
  v_jelly_balance integer;
begin
  select result into v_result from private.mutation_results
  where user_id = p_user_id and operation = 'claim_afk'
    and idempotency_key = p_idempotency_key;
  if v_result is not null then return v_result; end if;

  select * into v_claim from public.afk_claims
  where id = p_claim_id and user_id = p_user_id
  for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'AFK_CLAIM_NOT_FOUND';
  end if;
  if v_claim.status <> 'pending' then
    raise exception using errcode = 'P0001', message = 'AFK_ALREADY_CLAIMED';
  end if;

  v_gold := (v_claim.reward_payload ->> 'gold')::integer;
  v_experience := (v_claim.reward_payload ->> 'heroExperience')::integer;
  v_jelly := (v_claim.reward_payload ->> 'upgradeJelly')::integer;

  insert into public.reward_ledger (
    user_id, reward_identity, source_type, reward_payload
  )
  values (
    p_user_id, 'afk:' || p_claim_id::text, 'afk', v_claim.reward_payload
  );
  update public.player_currencies
  set balance = balance + v_gold
  where user_id = p_user_id and currency_code = 'gold'
  returning balance into v_gold_balance;
  update public.player_currencies
  set balance = balance + v_jelly
  where user_id = p_user_id and currency_code = 'upgrade_jelly'
  returning balance into v_jelly_balance;
  update public.player_heroes ph
  set total_experience = least(22864, ph.total_experience + v_experience)
  where ph.user_id = p_user_id
    and exists (
      select 1
      from public.team_members tm
      join public.player_teams pt on pt.id = tm.team_id
      where pt.user_id = p_user_id and pt.is_active
        and tm.player_hero_id = ph.id
    );
  update public.afk_claims
  set status = 'claimed',
      claimed_at = clock_timestamp(),
      claim_idempotency_key = p_idempotency_key
  where id = p_claim_id;

  v_result := jsonb_build_object(
    'claimId', p_claim_id,
    'goldAwarded', v_gold,
    'heroExperienceAwarded', v_experience,
    'upgradeJellyAwarded', v_jelly,
    'goldBalance', v_gold_balance,
    'upgradeJellyBalance', v_jelly_balance,
    'alreadyApplied', false
  );
  insert into private.mutation_results
    (user_id, operation, idempotency_key, result)
  values (p_user_id, 'claim_afk', p_idempotency_key, v_result);
  return v_result;
end;
$$;
create function public.update_player_activity(p_user_id uuid)
returns void
language sql
security definer
set search_path = pg_catalog, public
as $$
  update public.afk_state
  set last_activity_at = clock_timestamp()
  where user_id = p_user_id
    and last_activity_at < clock_timestamp() - interval '1 minute';
$$;
