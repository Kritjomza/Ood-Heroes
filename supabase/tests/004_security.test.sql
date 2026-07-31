begin;
create extension if not exists pgtap with schema extensions;

select plan(8);

select ok(
  not has_table_privilege('authenticated', 'public.player_currencies', 'INSERT'),
  'authenticated cannot insert currency'
);
select ok(
  not has_table_privilege('authenticated', 'public.player_currencies', 'UPDATE'),
  'authenticated cannot update currency'
);
select ok(
  not has_table_privilege('authenticated', 'public.player_heroes', 'INSERT'),
  'authenticated cannot grant a Hero'
);
select ok(
  not has_table_privilege('authenticated', 'public.player_heroes', 'UPDATE'),
  'authenticated cannot edit Hero progression'
);
select ok(
  not has_table_privilege('authenticated', 'public.reward_ledger', 'INSERT'),
  'authenticated cannot insert a reward ledger row'
);
select ok(
  not has_table_privilege('authenticated', 'public.afk_claims', 'UPDATE'),
  'authenticated cannot claim AFK rewards directly'
);
select ok(
  not has_table_privilege('anon', 'public.profiles', 'SELECT'),
  'unauthenticated role cannot read profiles'
);
select ok(
  not has_table_privilege('anon', 'public.player_heroes', 'SELECT'),
  'unauthenticated role cannot read Heroes'
);

select * from finish();
rollback;
