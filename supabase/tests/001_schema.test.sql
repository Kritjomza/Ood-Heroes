begin;
create extension if not exists pgtap with schema extensions;

select plan(26);

select has_table('public', 'schema_versions', 'schema_versions exists');
select has_table('public', 'profiles', 'profiles exists');
select has_table('public', 'hero_definitions', 'hero_definitions exists');
select has_table('public', 'player_heroes', 'player_heroes exists');
select has_table('public', 'player_currencies', 'player_currencies exists');
select has_table('public', 'player_teams', 'player_teams exists');
select has_table('public', 'team_members', 'team_members exists');
select has_table('public', 'summon_banners', 'summon_banners exists');
select has_table('public', 'summon_pool_entries', 'summon_pool_entries exists');
select has_table('public', 'player_summon_state', 'player_summon_state exists');
select has_table('public', 'summon_history', 'summon_history exists');
select has_table('public', 'reward_ledger', 'reward_ledger exists');
select has_table('public', 'afk_state', 'afk_state exists');
select has_table('public', 'afk_claims', 'afk_claims exists');

select col_type_is('public', 'profiles', 'user_id', 'uuid', 'profile identity is UUID');
select col_type_is(
  'public',
  'player_heroes',
  'total_experience',
  'integer',
  'Hero EXP is an integer'
);
select col_type_is(
  'public',
  'reward_ledger',
  'reward_payload',
  'jsonb',
  'reward payload is JSONB'
);

select has_index(
  'public',
  'profiles',
  'profiles_last_seen_at_idx',
  'profile activity lookup is indexed'
);
select has_index(
  'public',
  'player_heroes',
  'player_heroes_user_definition_idx',
  'Hero ownership lookup is indexed'
);
select has_index(
  'public',
  'summon_history',
  'summon_history_user_created_at_idx',
  'Summon history lookup is indexed'
);
select has_index(
  'public',
  'reward_ledger',
  'reward_ledger_user_created_at_idx',
  'reward history lookup is indexed'
);
select has_index(
  'public',
  'afk_claims',
  'afk_claims_user_status_idx',
  'AFK pending lookup is indexed'
);

select results_eq(
  'select version from public.schema_versions order by version',
  array[1],
  'schema version 1 is installed'
);
select results_eq(
  'select count(*)::integer from public.hero_definitions where enabled',
  array[6],
  'exactly six enabled Heroes are seeded'
);
select results_eq(
  $$select count(*)::integer from public.hero_definitions where starter_eligible$$,
  array[3],
  'exactly three Heroes are starter eligible'
);
select results_eq(
  $$select count(*)::integer from public.summon_banners where id = 'standard_odd_heroes' and enabled$$,
  array[1],
  'the Standard Banner is seeded and enabled'
);

select * from finish();
rollback;
