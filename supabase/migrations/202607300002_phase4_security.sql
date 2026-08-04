alter table public.schema_versions enable row level security;
alter table public.profiles enable row level security;
alter table public.hero_definitions enable row level security;
alter table public.player_heroes enable row level security;
alter table public.player_currencies enable row level security;
alter table public.player_teams enable row level security;
alter table public.team_members enable row level security;
alter table public.summon_banners enable row level security;
alter table public.summon_pool_entries enable row level security;
alter table public.player_summon_state enable row level security;
alter table public.summon_history enable row level security;
alter table public.reward_ledger enable row level security;
alter table public.afk_state enable row level security;
alter table public.afk_claims enable row level security;
revoke all on all tables in schema public from anon, authenticated;
grant usage on schema public to authenticated;
grant select on public.profiles to authenticated;
grant select on public.hero_definitions to authenticated;
grant select on public.player_heroes to authenticated;
grant select on public.player_currencies to authenticated;
grant select on public.player_teams to authenticated;
grant select on public.team_members to authenticated;
grant select on public.summon_banners to authenticated;
grant select on public.summon_pool_entries to authenticated;
grant select on public.summon_history to authenticated;
grant select on public.afk_claims to authenticated;
create policy profiles_read_own
on public.profiles for select to authenticated
using ((select auth.uid()) = user_id);
create policy hero_definitions_read_enabled
on public.hero_definitions for select to authenticated
using (enabled);
create policy player_heroes_read_own
on public.player_heroes for select to authenticated
using ((select auth.uid()) = user_id);
create policy player_currencies_read_own
on public.player_currencies for select to authenticated
using ((select auth.uid()) = user_id);
create policy player_teams_read_own
on public.player_teams for select to authenticated
using ((select auth.uid()) = user_id);
create policy team_members_read_own
on public.team_members for select to authenticated
using (
  exists (
    select 1
    from public.player_teams
    where player_teams.id = team_members.team_id
      and player_teams.user_id = (select auth.uid())
  )
);
create policy summon_banners_read_enabled
on public.summon_banners for select to authenticated
using (
  enabled
  and (starts_at is null or starts_at <= now())
  and (ends_at is null or ends_at > now())
);
create policy summon_pool_entries_read_enabled
on public.summon_pool_entries for select to authenticated
using (
  exists (
    select 1
    from public.summon_banners
    where summon_banners.id = summon_pool_entries.banner_id
      and summon_banners.enabled
  )
);
create policy summon_history_read_own
on public.summon_history for select to authenticated
using ((select auth.uid()) = user_id);
create policy afk_claims_read_own
on public.afk_claims for select to authenticated
using ((select auth.uid()) = user_id);
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
