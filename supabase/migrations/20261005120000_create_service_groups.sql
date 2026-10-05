/*
 * Service groups: the headings of the services menu, as rows of their own.
 *
 * Until now a group existed only as the `group` text on each service, so it
 * could not exist before its first service, could only be renamed service by
 * service, sat wherever its first member's `sort_order` put it, and could not
 * say whether its services are motoring offences — the offence page decided
 * that by comparing the heading with "Representation".
 *
 * Services still name their group in `content.group`, on purpose. The public
 * reads, the static fallback and the seed verifier all work from that name,
 * and keeping it means the site deployed before this migration keeps working
 * against the database after it. Triggers keep the two in step:
 *
 *  - a service naming a group that does not exist creates it, at the end;
 *  - renaming a group renames it on every service in it;
 *  - a group cannot be deleted while any service, draft or published, is in
 *    it.
 */

create table public.service_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order integer not null default 0,
  -- Whether its services are motoring offences. An offence page reads the
  -- reference line as a statute and asks for a driving record only when so.
  motoring boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint service_groups_name_check check (
    name = btrim(name) and char_length(name) between 1 and 60
  )
);

create trigger service_groups_touch_updated_at
  before update on public.service_groups
  for each row execute function private.touch_updated_at();


-- ---------------------------------------------------------------------------
-- Backfill: every group in use, in the order the menu shows them today — the
-- order of each group's first member. "Representation" is the one group the
-- site has treated as non-motoring.
-- ---------------------------------------------------------------------------

insert into public.service_groups (name, sort_order, motoring)
select
  content ->> 'group',
  row_number() over (order by min(sort_order)),
  content ->> 'group' <> 'Representation'
from public.services
where nullif(content ->> 'group', '') is not null
group by content ->> 'group';


-- ---------------------------------------------------------------------------
-- A service's group always exists
-- ---------------------------------------------------------------------------

create function private.ensure_service_group()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  group_name text := nullif(new.content ->> 'group', '');
begin
  if group_name is null then
    return new;
  end if;

  insert into public.service_groups (name, sort_order)
  select group_name, coalesce(max(sort_order), 0) + 1
  from public.service_groups
  on conflict (name) do nothing;

  return new;
end;
$$;

revoke all on function private.ensure_service_group()
from public, anon, authenticated;

create trigger services_ensure_group
  before insert or update of content on public.services
  for each row execute function private.ensure_service_group();


-- ---------------------------------------------------------------------------
-- Renaming a group renames it on its services
-- ---------------------------------------------------------------------------

create function private.rename_service_group()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  update public.services
  set content = jsonb_set(content, '{group}', to_jsonb(new.name))
  where content ->> 'group' = old.name;

  return null;
end;
$$;

revoke all on function private.rename_service_group()
from public, anon, authenticated;

create trigger service_groups_rename_services
  after update of name on public.service_groups
  for each row
  when (old.name is distinct from new.name)
  execute function private.rename_service_group();


-- ---------------------------------------------------------------------------
-- A group with services in it cannot be deleted
-- ---------------------------------------------------------------------------

create function private.protect_service_group()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if exists (
    select 1 from public.services where content ->> 'group' = old.name
  ) then
    raise exception using
      errcode = '23503',
      message = format('service group "%s" still has services', old.name);
  end if;

  return old;
end;
$$;

revoke all on function private.protect_service_group()
from public, anon, authenticated;

create trigger service_groups_protect_delete
  before delete on public.service_groups
  for each row execute function private.protect_service_group();


-- ---------------------------------------------------------------------------
-- Row-level security and explicit Data API grants
-- ---------------------------------------------------------------------------

alter table public.service_groups enable row level security;

revoke all on table public.service_groups from public, anon, authenticated;
grant select on table public.service_groups to anon, authenticated;
grant insert, update, delete on table public.service_groups to authenticated;
grant select, insert, update, delete on table public.service_groups to service_role;

-- Visitors see a group only once something in it is published, so a group
-- being prepared stays as private as its draft services. The subquery runs
-- under the caller's own policies on `services`, which show them only
-- published rows anyway.
create policy "Anyone can read groups with published services"
on public.service_groups for select
to anon, authenticated
using (
  exists (
    select 1
    from public.services
    where services.published
      and services.content ->> 'group' = service_groups.name
  )
);

create policy "Admins can manage service groups"
on public.service_groups for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));
