begin;
create extension if not exists pgtap with schema extensions;

select plan(13);

select has_table('public', 'mmo_world_checkpoints', 'MMO checkpoints exist');
select has_table('private', 'mmo_lease_audit', 'private lease audit exists');
select has_function(
  'public',
  'save_mmo_world_checkpoint',
  array['uuid', 'text', 'text', 'text', 'bigint', 'timestamp with time zone', 'jsonb'],
  'atomic checkpoint function exists'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.mmo_world_checkpoints'::regclass),
  'checkpoint RLS is enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'private.mmo_lease_audit'::regclass),
  'lease audit RLS is enabled'
);
select has_index(
  'public',
  'mmo_world_checkpoints',
  'mmo_world_checkpoints_checkpointed_at_idx',
  'checkpoint recency is indexed'
);
select has_index(
  'private',
  'mmo_lease_audit',
  'mmo_lease_audit_account_created_idx',
  'lease account history is indexed'
);
select is(
  (select count(*)::integer from pg_policies where schemaname = 'public' and tablename = 'mmo_world_checkpoints'),
  1,
  'checkpoint exposes exactly one ownership policy'
);
select ok(
  has_table_privilege('authenticated', 'public.mmo_world_checkpoints', 'SELECT'),
  'authenticated users can request checkpoint reads'
);
select ok(
  not has_table_privilege('authenticated', 'public.mmo_world_checkpoints', 'INSERT'),
  'authenticated users cannot insert checkpoints'
);
select ok(
  not has_table_privilege('authenticated', 'private.mmo_lease_audit', 'SELECT'),
  'lease audit is unavailable to authenticated users'
);
select ok(
  not has_function_privilege(
    'authenticated',
    'public.save_mmo_world_checkpoint(uuid,text,text,text,bigint,timestamptz,jsonb)',
    'EXECUTE'
  ),
  'authenticated users cannot call the checkpoint mutation'
);
select ok(
  has_function_privilege(
    'service_role',
    'public.save_mmo_world_checkpoint(uuid,text,text,text,bigint,timestamptz,jsonb)',
    'EXECUTE'
  ),
  'service role can call the checkpoint mutation'
);

select * from finish();
rollback;
