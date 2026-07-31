revoke all on all functions in schema public from public, anon, authenticated;
revoke all on all functions in schema private from public, anon, authenticated;

grant usage on schema public to service_role;
grant usage on schema private to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
grant select, insert, update, delete on all tables in schema private to service_role;
grant execute on function public.initialize_player_account(uuid, text, text) to service_role;
grant execute on function public.get_player_bootstrap(uuid) to service_role;
grant execute on function public.update_player_profile(uuid, text, text) to service_role;
grant execute on function public.get_summon_history(uuid, integer) to service_role;
grant execute on function public.perform_summon(uuid, text, uuid) to service_role;
grant execute on function public.upgrade_hero_star(uuid, uuid, uuid) to service_role;
grant execute on function public.update_active_team(uuid, uuid[], uuid) to service_role;
grant execute on function public.unlock_team_slot(uuid, uuid) to service_role;
grant execute on function public.apply_combat_reward(uuid, text, integer, integer, uuid[], uuid[])
  to service_role;
grant execute on function public.prepare_afk_claim(uuid) to service_role;
grant execute on function public.claim_afk_reward(uuid, uuid, uuid) to service_role;
grant execute on function public.update_player_activity(uuid) to service_role;
grant execute on function private.player_bootstrap(uuid) to service_role;

revoke all on table private.mutation_results from public, anon, authenticated;
