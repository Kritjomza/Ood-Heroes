-- Durable parties, consented friendship, and private instance recovery.

create table public.mmo_parties (
  party_id uuid primary key,
  leader_account_id uuid not null references public.profiles(user_id) on delete cascade,
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now()
);

create table public.mmo_party_members (
  party_id uuid not null references public.mmo_parties(party_id) on delete cascade,
  account_id uuid not null references public.profiles(user_id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (party_id, account_id)
);

create index mmo_party_members_account_idx on public.mmo_party_members (account_id, party_id);

create table public.mmo_party_invites (
  party_id uuid not null references public.mmo_parties(party_id) on delete cascade,
  target_account_id uuid not null references public.profiles(user_id) on delete cascade,
  invited_by uuid not null references public.profiles(user_id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  created_at timestamptz not null default now(),
  primary key (party_id, target_account_id)
);

create table public.mmo_friend_consents (
  from_account_id uuid not null references public.profiles(user_id) on delete cascade,
  to_account_id uuid not null references public.profiles(user_id) on delete cascade,
  granted_at timestamptz not null default now(),
  primary key (from_account_id, to_account_id),
  check (from_account_id <> to_account_id)
);

create table public.mmo_private_instances (
  instance_id text primary key check (char_length(instance_id) between 1 and 128),
  kind text not null check (kind in ('story', 'dungeon')),
  leader_account_id uuid not null references public.profiles(user_id) on delete cascade,
  status text not null check (status in ('forming', 'active', 'recovering', 'completed', 'failed')),
  checkpoint_revision bigint not null default 0 check (checkpoint_revision >= 0),
  checkpoint_payload jsonb not null default '{}'::jsonb check (jsonb_typeof(checkpoint_payload) = 'object'),
  revive_tokens integer not null default 0 check (revive_tokens >= 0),
  world_revision bigint not null default 0 check (world_revision >= 0),
  updated_at timestamptz not null default now()
);

create table public.mmo_instance_members (
  instance_id text not null references public.mmo_private_instances(instance_id) on delete cascade,
  account_id uuid not null references public.profiles(user_id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (instance_id, account_id)
);

create index mmo_instance_members_account_idx on public.mmo_instance_members (account_id, instance_id);

alter table public.mmo_parties enable row level security;
alter table public.mmo_party_members enable row level security;
alter table public.mmo_party_invites enable row level security;
alter table public.mmo_friend_consents enable row level security;
alter table public.mmo_private_instances enable row level security;
alter table public.mmo_instance_members enable row level security;

create policy "Party members can read their party" on public.mmo_parties for select to authenticated
using (exists (select 1 from public.mmo_party_members m where m.party_id = mmo_parties.party_id and m.account_id = (select auth.uid())));
create policy "Party members can read membership" on public.mmo_party_members for select to authenticated
using (account_id = (select auth.uid()));
create policy "Invitees can read their invites" on public.mmo_party_invites for select to authenticated
using (target_account_id = (select auth.uid()) or invited_by = (select auth.uid()));
create policy "Users can read their friend consents" on public.mmo_friend_consents for select to authenticated
using (from_account_id = (select auth.uid()) or to_account_id = (select auth.uid()));
create policy "Instance members can read instance" on public.mmo_private_instances for select to authenticated
using (leader_account_id = (select auth.uid()) or exists (select 1 from public.mmo_instance_members m where m.instance_id = mmo_private_instances.instance_id and m.account_id = (select auth.uid())));
create policy "Instance members can read membership" on public.mmo_instance_members for select to authenticated
using (account_id = (select auth.uid()));

revoke all on table public.mmo_parties, public.mmo_party_members, public.mmo_party_invites,
  public.mmo_friend_consents, public.mmo_private_instances, public.mmo_instance_members
  from public, anon, authenticated;
grant select on table public.mmo_parties, public.mmo_party_members, public.mmo_party_invites,
  public.mmo_friend_consents, public.mmo_private_instances, public.mmo_instance_members to authenticated;
grant select, insert, update, delete on table public.mmo_parties, public.mmo_party_members, public.mmo_party_invites,
  public.mmo_friend_consents, public.mmo_private_instances, public.mmo_instance_members to service_role;
