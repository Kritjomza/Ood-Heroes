begin;
create extension if not exists pgtap with schema extensions;

select plan(41);

insert into auth.users (id, aud, role, email, is_anonymous, created_at, updated_at)
values
  ('10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated',
   'phase4-one@example.test', false, now(), now()),
  ('10000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated',
   'phase4-two@example.test', false, now(), now());

select has_function(
  'public', 'initialize_player_account', array['uuid', 'text', 'text'],
  'account initialization RPC exists'
);
select has_function(
  'public', 'perform_summon', array['uuid', 'text', 'uuid'],
  'Summon RPC exists'
);
select has_function(
  'public', 'upgrade_hero_star', array['uuid', 'uuid', 'uuid'],
  'Star upgrade RPC exists'
);
select has_function(
  'public', 'update_active_team', array['uuid', 'uuid[]', 'uuid'],
  'team update RPC exists'
);
select has_function(
  'public', 'unlock_team_slot', array['uuid', 'uuid'],
  'team slot unlock RPC exists'
);

select lives_ok(
  $$select public.initialize_player_account(
    '10000000-0000-0000-0000-000000000001', 'Odd One', 'permanent'
  )$$,
  'account initialization succeeds'
);
select lives_ok(
  $$select public.initialize_player_account(
    '10000000-0000-0000-0000-000000000001', 'Changed Name', 'permanent'
  )$$,
  'account initialization replays safely'
);

select is(
  (select count(*)::integer from public.profiles
   where user_id = '10000000-0000-0000-0000-000000000001'),
  1, 'initialization creates one profile'
);
select is(
  (select display_name from public.profiles
   where user_id = '10000000-0000-0000-0000-000000000001'),
  'Odd One', 'replayed initialization does not overwrite the profile'
);
select is(
  (select jsonb_object_agg(currency_code, balance) from public.player_currencies
   where user_id = '10000000-0000-0000-0000-000000000001'),
  '{"gem": 300, "gold": 500, "upgrade_jelly": 0}'::jsonb,
  'starter currencies are exact'
);
select is(
  (select count(*)::integer from public.player_heroes
   where user_id = '10000000-0000-0000-0000-000000000001'),
  1, 'initialization grants one starter'
);
select is(
  (select count(*)::integer
   from public.team_members tm
   join public.player_teams pt on pt.id = tm.team_id
   where pt.user_id = '10000000-0000-0000-0000-000000000001'),
  1, 'starter occupies team slot one'
);
select is(
  (select count(*)::integer from public.reward_ledger
   where user_id = '10000000-0000-0000-0000-000000000001'
     and reward_identity = 'starter:v1'),
  1, 'one starter ledger identity exists'
);

select lives_ok(
  $$select public.perform_summon(
    '10000000-0000-0000-0000-000000000001',
    'standard_odd_heroes',
    '20000000-0000-0000-0000-000000000001'
  )$$,
  'Summon succeeds'
);
select lives_ok(
  $$select public.perform_summon(
    '10000000-0000-0000-0000-000000000001',
    'standard_odd_heroes',
    '20000000-0000-0000-0000-000000000001'
  )$$,
  'same-key Summon replay succeeds'
);
select is(
  (select balance from public.player_currencies
   where user_id = '10000000-0000-0000-0000-000000000001'
     and currency_code = 'gem'),
  200, 'same-key Summon deducts Gems once'
);
select is(
  (select count(*)::integer from public.summon_history
   where user_id = '10000000-0000-0000-0000-000000000001'),
  1, 'same-key Summon records one history row'
);

update public.player_heroes set shards = 100
where user_id = '10000000-0000-0000-0000-000000000001';

select lives_ok(
  format(
    'select public.upgrade_hero_star(%L, %L, %L)',
    '10000000-0000-0000-0000-000000000001',
    (select id from public.player_heroes
     where user_id = '10000000-0000-0000-0000-000000000001'
     order by acquired_at limit 1),
    '20000000-0000-0000-0000-000000000002'
  ),
  'Star upgrade succeeds'
);
select lives_ok(
  format(
    'select public.upgrade_hero_star(%L, %L, %L)',
    '10000000-0000-0000-0000-000000000001',
    (select id from public.player_heroes
     where user_id = '10000000-0000-0000-0000-000000000001'
     order by acquired_at limit 1),
    '20000000-0000-0000-0000-000000000002'
  ),
  'same-key Star replay succeeds'
);
select is(
  (select stars::integer from public.player_heroes
   where user_id = '10000000-0000-0000-0000-000000000001'
   order by acquired_at limit 1),
  2, 'same-key Star replay increments once'
);
select is(
  (select shards from public.player_heroes
   where user_id = '10000000-0000-0000-0000-000000000001'
   order by acquired_at limit 1),
  80, 'same-key Star replay deducts Shards once'
);

select public.initialize_player_account(
  '10000000-0000-0000-0000-000000000002', 'Odd Two', 'permanent'
);
select throws_ok(
  format(
    'select public.update_active_team(%L, array[%L]::uuid[], %L)',
    '10000000-0000-0000-0000-000000000001',
    (select id from public.player_heroes
     where user_id = '10000000-0000-0000-0000-000000000002' limit 1),
    '20000000-0000-0000-0000-000000000003'
  ),
  'P0001', 'HERO_NOT_OWNED',
  'team update rejects a cross-user Hero'
);

insert into public.player_heroes (user_id, hero_definition_id)
select '10000000-0000-0000-0000-000000000001', id
from public.hero_definitions
where id not in (
  select hero_definition_id from public.player_heroes
  where user_id = '10000000-0000-0000-0000-000000000001'
)
order by sort_order
limit 2;

select lives_ok(
  $$select public.unlock_team_slot(
    '10000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000004'
  )$$,
  'Slot 3 unlock succeeds with three Heroes'
);
select lives_ok(
  $$select public.unlock_team_slot(
    '10000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000004'
  )$$,
  'same-key Slot 3 replay succeeds'
);
select is(
  (select team_slots::integer from public.profiles
   where user_id = '10000000-0000-0000-0000-000000000001'),
  3, 'Slot 3 is unlocked'
);
select is(
  (select balance from public.player_currencies
   where user_id = '10000000-0000-0000-0000-000000000001'
     and currency_code = 'gold'),
  0, 'Slot 3 costs Gold exactly once'
);

select has_function(
  'public', 'apply_combat_reward',
  array['uuid', 'text', 'integer', 'integer', 'uuid[]', 'uuid[]'],
  'combat reward RPC exists'
);
select has_function(
  'public', 'prepare_afk_claim', array['uuid'],
  'AFK prepare RPC exists'
);
select has_function(
  'public', 'claim_afk_reward', array['uuid', 'uuid', 'uuid'],
  'AFK claim RPC exists'
);

select lives_ok(
  format(
    'select public.apply_combat_reward(%L, %L, 50, 30, array[%L]::uuid[], array[]::uuid[])',
    '10000000-0000-0000-0000-000000000001',
    'room-a:monster-1:1',
    (select player_hero_id from public.team_members tm
     join public.player_teams pt on pt.id = tm.team_id
     where pt.user_id = '10000000-0000-0000-0000-000000000001'
       and pt.is_active limit 1)
  ),
  'combat reward succeeds'
);
select lives_ok(
  format(
    'select public.apply_combat_reward(%L, %L, 50, 30, array[%L]::uuid[], array[]::uuid[])',
    '10000000-0000-0000-0000-000000000001',
    'room-a:monster-1:1',
    (select player_hero_id from public.team_members tm
     join public.player_teams pt on pt.id = tm.team_id
     where pt.user_id = '10000000-0000-0000-0000-000000000001'
       and pt.is_active limit 1)
  ),
  'combat reward replay succeeds'
);
select is(
  (select balance from public.player_currencies
   where user_id = '10000000-0000-0000-0000-000000000001'
     and currency_code = 'gold'),
  50, 'combat reward Gold applies exactly once'
);
select is(
  (select count(*)::integer from public.reward_ledger
   where user_id = '10000000-0000-0000-0000-000000000001'
     and reward_identity = 'room-a:monster-1:1'),
  1, 'combat reward ledger identity is unique'
);
select is(
  (select total_experience from public.player_heroes ph
   join public.team_members tm on tm.player_hero_id = ph.id
   join public.player_teams pt on pt.id = tm.team_id
   where pt.user_id = '10000000-0000-0000-0000-000000000001'
     and pt.is_active limit 1),
  30, 'living active Hero receives full combat EXP once'
);

update public.afk_state
set last_settled_at = clock_timestamp() - interval '61 minutes'
where user_id = '10000000-0000-0000-0000-000000000001';

select lives_ok(
  $$select public.prepare_afk_claim(
    '10000000-0000-0000-0000-000000000001'
  )$$,
  'AFK claim preparation succeeds'
);
select is(
  (select interval_count from public.afk_claims
   where user_id = '10000000-0000-0000-0000-000000000001'
     and status = 'pending'),
  2, '61 minutes prepares two complete AFK intervals'
);
select lives_ok(
  format(
    'select public.claim_afk_reward(%L, %L, %L)',
    '10000000-0000-0000-0000-000000000001',
    (select id from public.afk_claims
     where user_id = '10000000-0000-0000-0000-000000000001'
       and status = 'pending'),
    '20000000-0000-0000-0000-000000000005'
  ),
  'AFK claim succeeds'
);
select lives_ok(
  format(
    'select public.claim_afk_reward(%L, %L, %L)',
    '10000000-0000-0000-0000-000000000001',
    (select id from public.afk_claims
     where user_id = '10000000-0000-0000-0000-000000000001'
       and status = 'claimed'),
    '20000000-0000-0000-0000-000000000005'
  ),
  'same-key AFK claim replay succeeds'
);
select is(
  (select balance from public.player_currencies
   where user_id = '10000000-0000-0000-0000-000000000001'
     and currency_code = 'gold'),
  150, 'AFK Gold applies exactly once'
);
select is(
  (select balance from public.player_currencies
   where user_id = '10000000-0000-0000-0000-000000000001'
     and currency_code = 'upgrade_jelly'),
  2, 'AFK Jelly applies exactly once'
);
select is(
  (select count(*)::integer from public.reward_ledger
   where user_id = '10000000-0000-0000-0000-000000000001'
     and source_type = 'afk'),
  1, 'AFK ledger identity is unique'
);

select * from finish();
rollback;
