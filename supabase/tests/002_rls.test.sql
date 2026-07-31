begin;
create extension if not exists pgtap with schema extensions;

select plan(14);

select ok(relrowsecurity, 'RLS enabled on profiles')
from pg_class
where oid = 'public.profiles'::regclass;
select ok(relrowsecurity, 'RLS enabled on hero_definitions')
from pg_class
where oid = 'public.hero_definitions'::regclass;
select ok(relrowsecurity, 'RLS enabled on player_heroes')
from pg_class
where oid = 'public.player_heroes'::regclass;
select ok(relrowsecurity, 'RLS enabled on player_currencies')
from pg_class
where oid = 'public.player_currencies'::regclass;
select ok(relrowsecurity, 'RLS enabled on player_teams')
from pg_class
where oid = 'public.player_teams'::regclass;
select ok(relrowsecurity, 'RLS enabled on team_members')
from pg_class
where oid = 'public.team_members'::regclass;
select ok(relrowsecurity, 'RLS enabled on summon_banners')
from pg_class
where oid = 'public.summon_banners'::regclass;
select ok(relrowsecurity, 'RLS enabled on summon_pool_entries')
from pg_class
where oid = 'public.summon_pool_entries'::regclass;
select ok(relrowsecurity, 'RLS enabled on player_summon_state')
from pg_class
where oid = 'public.player_summon_state'::regclass;
select ok(relrowsecurity, 'RLS enabled on summon_history')
from pg_class
where oid = 'public.summon_history'::regclass;
select ok(relrowsecurity, 'RLS enabled on reward_ledger')
from pg_class
where oid = 'public.reward_ledger'::regclass;
select ok(relrowsecurity, 'RLS enabled on afk_state')
from pg_class
where oid = 'public.afk_state'::regclass;
select ok(relrowsecurity, 'RLS enabled on afk_claims')
from pg_class
where oid = 'public.afk_claims'::regclass;
select is(
  (select count(*)::integer from pg_policies where schemaname = 'public' and cmd = 'SELECT'),
  10,
  'only the ten intended player/definition read policies exist'
);

select * from finish();
rollback;
