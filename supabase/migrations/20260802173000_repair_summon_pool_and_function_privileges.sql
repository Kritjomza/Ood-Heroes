-- Production migrations do not execute seed.sql. Keep the standard banner usable
-- by carrying its authoritative pool into migration history.
insert into public.summon_pool_entries (banner_id, hero_definition_id, weight)
values
  ('standard_odd_heroes', 'hero_001_grilled_chicken', 2750),
  ('standard_odd_heroes', 'hero_002_pink_chocolate_lizard', 1500),
  ('standard_odd_heroes', 'hero_003_robot_jelly', 2750),
  ('standard_odd_heroes', 'hero_004_tofu_rabbit', 1500),
  ('standard_odd_heroes', 'hero_005_accountant_octopus', 1200),
  ('standard_odd_heroes', 'hero_006_samurai_bread', 300)
on conflict (banner_id, hero_definition_id)
do update set weight = excluded.weight;
revoke execute on function private.player_bootstrap(uuid) from public, anon, authenticated;
revoke execute on function private.player_bootstrap_legacy(uuid) from public, anon, authenticated;
grant execute on function private.player_bootstrap(uuid) to service_role;
