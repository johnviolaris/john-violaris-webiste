begin;

select plan(21);

select has_table('public', 'service_groups', 'service_groups table exists');
select ok(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.service_groups'::regclass
  ),
  'row level security is enabled on service_groups'
);
select ok(
  not has_table_privilege('anon', 'public.service_groups', 'insert,update,delete'),
  'anonymous visitors cannot change service groups'
);
select policies_are(
  'public',
  'service_groups',
  array[
    'Admins can manage service groups',
    'Anyone can read groups with published services'
  ],
  'service_groups has a public read policy and an admin policy'
);
select has_trigger(
  'public',
  'services',
  'services_ensure_group',
  'a service naming a missing group creates it'
);
select has_trigger(
  'public',
  'service_groups',
  'service_groups_rename_services',
  'renaming a group renames it on its services'
);
select has_trigger(
  'public',
  'service_groups',
  'service_groups_protect_delete',
  'a group with services cannot be deleted'
);

-- The backfill covers every group the seeded catalogue uses.
select is(
  (
    select count(*)::bigint
    from public.services
    where content ->> 'group' not in (select name from public.service_groups)
  ),
  0::bigint,
  'every service names a group that exists'
);
select is(
  (select motoring from public.service_groups where name = 'Representation'),
  false,
  'Representation is the non-motoring group'
);

-- A service naming an unknown group creates it at the end.
insert into public.services (slug, name, published, content)
values (
  'pgtap-grouped',
  'Grouped service',
  false,
  '{"group": "pgTAP Group", "icon": "document"}'::jsonb
);

select is(
  (select count(*)::bigint from public.service_groups where name = 'pgTAP Group'),
  1::bigint,
  'saving a service with a new group name creates the group'
);
select is(
  (select sort_order from public.service_groups where name = 'pgTAP Group'),
  (
    select max(sort_order)
    from public.service_groups
  ),
  'a group created that way goes to the end'
);
select is(
  (select motoring from public.service_groups where name = 'pgTAP Group'),
  true,
  'a new group is motoring until told otherwise'
);

-- Renaming carries the services with it.
update public.service_groups
set name = 'pgTAP Renamed'
where name = 'pgTAP Group';

select is(
  (select content ->> 'group' from public.services where slug = 'pgtap-grouped'),
  'pgTAP Renamed',
  'renaming a group renames it on its services'
);
select is(
  (select count(*)::bigint from public.service_groups where name = 'pgTAP Group'),
  0::bigint,
  'the rename does not leave the old name behind as a second group'
);

-- A group with a service in it is protected; an empty one is not.
select throws_ok(
  $$delete from public.service_groups where name = 'pgTAP Renamed'$$,
  '23503',
  null,
  'a group with services cannot be deleted'
);

insert into public.service_groups (name, sort_order)
values ('pgTAP Empty', 999);

select lives_ok(
  $$delete from public.service_groups where name = 'pgTAP Empty'$$,
  'an empty group can be deleted'
);

-- Visitors see only groups with something published in them.
insert into public.service_groups (name, sort_order)
values ('pgTAP Hidden', 998);

set local role anon;
select is(
  (select count(*)::bigint from public.service_groups where name = 'pgTAP Hidden'),
  0::bigint,
  'an empty group is not visible to visitors'
);
select is(
  (select count(*)::bigint from public.service_groups where name = 'pgTAP Renamed'),
  0::bigint,
  'a group with only draft services is not visible to visitors'
);
select throws_ok(
  $$insert into public.service_groups (name) values ('Anonymous group')$$,
  '42501',
  null,
  'anonymous visitors cannot create groups'
);
reset role;

-- The real path: an authenticated admin, under RLS, through trigger functions
-- that are revoked from every client role.
insert into auth.users (
  id,
  email,
  aud,
  role,
  raw_app_meta_data,
  raw_user_meta_data
)
values (
  '00000000-0000-4000-8000-000000000301'::uuid,
  'group-admin@example.test',
  'authenticated',
  'authenticated',
  '{}'::jsonb,
  '{}'::jsonb
);

update public.profiles
set role = 'admin'
where id = '00000000-0000-4000-8000-000000000301'::uuid;

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-4000-8000-000000000301',
  true
);
select lives_ok(
  $$update public.service_groups
    set name = 'pgTAP Admin Renamed'
    where name = 'pgTAP Renamed'$$,
  'an authenticated admin can rename a group'
);
reset role;

select is(
  (select content ->> 'group' from public.services where slug = 'pgtap-grouped'),
  'pgTAP Admin Renamed',
  'the admin rename reached the draft service in the group'
);

select * from finish();

rollback;
