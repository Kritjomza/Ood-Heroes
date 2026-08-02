-- Invalidate obsolete half-hour EXP/Jelly parcels and begin the new economy cleanly.
update public.afk_claims
set status = 'claimed', claimed_at = clock_timestamp()
where status = 'pending';

update public.afk_state set last_settled_at = clock_timestamp();

do $$
begin
  if to_regprocedure('private.player_bootstrap_legacy(uuid)') is null then
    alter function private.player_bootstrap(uuid) rename to player_bootstrap_legacy;
  else
    drop function if exists private.player_bootstrap(uuid);
  end if;
end;
$$;

create function private.player_bootstrap(p_user_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select private.player_bootstrap_legacy(p_user_id) || jsonb_build_object(
    'pendingAfkClaim', (
      select ac.reward_payload || jsonb_build_object(
        'id', ac.id, 'periodStart', ac.period_start, 'periodEnd', ac.period_end
      )
      from public.afk_claims ac
      where ac.user_id = p_user_id and ac.status = 'pending'
      order by ac.prepared_at limit 1
    )
  );
$$;

revoke execute on function private.player_bootstrap(uuid) from public, anon, authenticated;
revoke execute on function private.player_bootstrap_legacy(uuid) from public, anon, authenticated;
grant execute on function private.player_bootstrap(uuid) to service_role;

create or replace function private.summon_result(p_user_id uuid, p_history_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'outcomeType', sh.outcome_type,
    'heroDefinitionId', sh.hero_definition_id,
    'heroDisplayName', hd.display_name,
    'heroRarity', hd.rarity,
    'shardsAwarded', sh.shards_awarded,
    'gemCost', sh.gem_cost,
    'gemBalance', (select balance from public.player_currencies
      where user_id = p_user_id and currency_code = 'gem'),
    'pityBefore', sh.pity_before,
    'pityAfter', sh.pity_after,
    'alreadyApplied', false
  )
  from public.summon_history sh
  join public.hero_definitions hd on hd.id = sh.hero_definition_id
  where sh.id = p_history_id and sh.user_id = p_user_id;
$$;

create or replace function public.prepare_afk_claim(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing public.afk_claims%rowtype;
  v_last_settled timestamptz;
  v_now timestamptz := clock_timestamp();
  v_minutes integer;
  v_rewarded_minutes integer;
  v_gold integer;
  v_diamonds integer;
  v_shards integer;
  v_recipients uuid[];
  v_claim_id uuid;
  v_payload jsonb;
begin
  if not exists (select 1 from public.profiles where user_id = p_user_id) then
    raise exception using errcode = 'P0001', message = 'PROFILE_NOT_FOUND';
  end if;

  select * into v_existing from public.afk_claims
  where user_id = p_user_id and status = 'pending'
  order by prepared_at limit 1 for update;
  if found then return v_existing.reward_payload || jsonb_build_object(
    'id', v_existing.id, 'periodStart', v_existing.period_start, 'periodEnd', v_existing.period_end
  ); end if;

  select last_settled_at into v_last_settled from public.afk_state
  where user_id = p_user_id for update;
  if not found then raise exception using errcode = 'P0001', message = 'PROFILE_NOT_FOUND'; end if;

  v_minutes := floor(extract(epoch from (v_now - v_last_settled)) / 60)::integer;
  if v_minutes < 10 then return null; end if;

  if v_minutes >= 30 then
    v_rewarded_minutes := 30; v_gold := 250; v_diamonds := 35; v_shards := 10;
  elsif v_minutes >= 20 then
    v_rewarded_minutes := 20; v_gold := 160; v_diamonds := 20; v_shards := 6;
  else
    v_rewarded_minutes := 10; v_gold := 80; v_diamonds := 10; v_shards := 3;
  end if;

  select array_agg(tm.player_hero_id order by tm.slot_index) into v_recipients
  from public.team_members tm
  join public.player_teams pt on pt.id = tm.team_id
  where pt.user_id = p_user_id and pt.is_active;
  if coalesce(array_length(v_recipients, 1), 0) = 0 then
    raise exception using errcode = 'P0001', message = 'TEAM_INVALID';
  end if;

  v_payload := jsonb_build_object(
    'rewardedMinutes', v_rewarded_minutes,
    'gold', v_gold,
    'diamonds', v_diamonds,
    'shardsPerActiveHero', v_shards,
    'recipientHeroIds', to_jsonb(v_recipients)
  );
  insert into public.afk_claims(user_id, period_start, period_end, interval_count, reward_payload, status)
  values (p_user_id, v_last_settled, v_now, v_rewarded_minutes / 10, v_payload, 'pending')
  returning id into v_claim_id;
  update public.afk_state set last_settled_at = v_now where user_id = p_user_id;
  return v_payload || jsonb_build_object('id', v_claim_id, 'periodStart', v_last_settled, 'periodEnd', v_now);
end;
$$;

create or replace function public.claim_afk_reward(p_user_id uuid, p_claim_id uuid, p_idempotency_key uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
  v_claim public.afk_claims%rowtype;
  v_gold integer; v_diamonds integer; v_shards integer;
  v_recipients uuid[];
  v_gold_balance integer; v_gem_balance integer;
begin
  select result into v_result from private.mutation_results
  where user_id = p_user_id and operation = 'claim_afk' and idempotency_key = p_idempotency_key;
  if v_result is not null then return v_result || jsonb_build_object('alreadyApplied', true); end if;

  select * into v_claim from public.afk_claims
  where id = p_claim_id and user_id = p_user_id for update;
  if not found then raise exception using errcode = 'P0001', message = 'AFK_CLAIM_NOT_FOUND'; end if;
  if v_claim.status <> 'pending' then raise exception using errcode = 'P0001', message = 'AFK_ALREADY_CLAIMED'; end if;

  v_gold := (v_claim.reward_payload ->> 'gold')::integer;
  v_diamonds := (v_claim.reward_payload ->> 'diamonds')::integer;
  v_shards := (v_claim.reward_payload ->> 'shardsPerActiveHero')::integer;
  select array_agg(value::text::uuid) into v_recipients
  from jsonb_array_elements_text(v_claim.reward_payload -> 'recipientHeroIds');

  insert into public.reward_ledger(user_id, reward_identity, source_type, reward_payload)
  values (p_user_id, 'afk:' || p_claim_id::text, 'afk', v_claim.reward_payload);
  update public.player_currencies set balance = balance + v_gold
  where user_id = p_user_id and currency_code = 'gold' returning balance into v_gold_balance;
  update public.player_currencies set balance = balance + v_diamonds
  where user_id = p_user_id and currency_code = 'gem' returning balance into v_gem_balance;
  update public.player_heroes set shards = shards + v_shards
  where user_id = p_user_id and id = any(v_recipients);
  if not found then raise exception using errcode = 'P0001', message = 'TEAM_INVALID'; end if;

  update public.afk_claims set status = 'claimed', claimed_at = clock_timestamp(),
    claim_idempotency_key = p_idempotency_key where id = p_claim_id;
  v_result := jsonb_build_object(
    'claimId', p_claim_id, 'goldAwarded', v_gold, 'diamondsAwarded', v_diamonds,
    'shardsPerActiveHeroAwarded', v_shards, 'recipientHeroIds', to_jsonb(v_recipients),
    'goldBalance', v_gold_balance, 'gemBalance', v_gem_balance, 'alreadyApplied', false
  );
  insert into private.mutation_results(user_id, operation, idempotency_key, result)
  values (p_user_id, 'claim_afk', p_idempotency_key, v_result);
  return v_result;
end;
$$;

revoke execute on function public.perform_summon(uuid, text, uuid) from public, anon, authenticated;
revoke execute on function public.prepare_afk_claim(uuid) from public, anon, authenticated;
revoke execute on function public.claim_afk_reward(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.perform_summon(uuid, text, uuid) to service_role;
grant execute on function public.prepare_afk_claim(uuid) to service_role;
grant execute on function public.claim_afk_reward(uuid, uuid, uuid) to service_role;
