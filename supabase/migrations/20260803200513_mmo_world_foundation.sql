create table public.mmo_world_checkpoints (
  account_id uuid primary key references public.profiles(user_id) on delete cascade,
  zone_id text not null check (char_length(zone_id) between 1 and 64),
  sanctuary_id text not null check (char_length(sanctuary_id) between 1 and 64),
  channel_hint text check (channel_hint is null or char_length(channel_hint) between 1 and 64),
  revision bigint not null check (revision >= 0),
  checkpointed_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object')
);

create index mmo_world_checkpoints_checkpointed_at_idx
  on public.mmo_world_checkpoints (checkpointed_at desc);

alter table public.mmo_world_checkpoints enable row level security;

create policy "Players can read their own MMO checkpoint"
on public.mmo_world_checkpoints
for select
to authenticated
using ((select auth.uid()) = account_id);

revoke all on table public.mmo_world_checkpoints from public, anon, authenticated;
grant select on table public.mmo_world_checkpoints to authenticated;
grant select, insert, update, delete on table public.mmo_world_checkpoints to service_role;

create table private.mmo_lease_audit (
  lease_id uuid primary key,
  account_id uuid not null references auth.users(id) on delete cascade,
  channel_id text not null check (char_length(channel_id) between 1 and 64),
  state text not null check (state in ('prepared', 'active', 'released', 'expired', 'recovered')),
  created_at timestamptz not null default now(),
  released_at timestamptz,
  check (released_at is null or released_at >= created_at)
);

create index mmo_lease_audit_account_created_idx
  on private.mmo_lease_audit (account_id, created_at desc);

alter table private.mmo_lease_audit enable row level security;
revoke all on table private.mmo_lease_audit from public, anon, authenticated;
grant select, insert, update, delete on table private.mmo_lease_audit to service_role;

create or replace function public.save_mmo_world_checkpoint(
  p_account_id uuid,
  p_zone_id text,
  p_sanctuary_id text,
  p_channel_hint text,
  p_revision bigint,
  p_checkpointed_at timestamptz,
  p_payload jsonb
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  affected_rows integer;
begin
  insert into public.mmo_world_checkpoints (
    account_id, zone_id, sanctuary_id, channel_hint, revision, checkpointed_at, payload
  ) values (
    p_account_id, p_zone_id, p_sanctuary_id, p_channel_hint, p_revision, p_checkpointed_at, p_payload
  )
  on conflict (account_id) do update
  set zone_id = excluded.zone_id,
      sanctuary_id = excluded.sanctuary_id,
      channel_hint = excluded.channel_hint,
      revision = excluded.revision,
      checkpointed_at = excluded.checkpointed_at,
      payload = excluded.payload
  where public.mmo_world_checkpoints.revision < excluded.revision;

  get diagnostics affected_rows = row_count;
  return affected_rows = 1;
end;
$$;

revoke all on function public.save_mmo_world_checkpoint(uuid, text, text, text, bigint, timestamptz, jsonb)
  from public, anon, authenticated;
grant execute on function public.save_mmo_world_checkpoint(uuid, text, text, text, bigint, timestamptz, jsonb)
  to service_role;;
