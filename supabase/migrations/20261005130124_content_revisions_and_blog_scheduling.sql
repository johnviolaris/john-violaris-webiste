-- Local review migration: apply before deploying the publishing/history UI.
alter table public.blog_posts add column unpublish_at timestamptz;
alter table public.blog_posts add constraint blog_posts_publication_window_check
  check (unpublish_at is null or published_at is null or unpublish_at > published_at);

drop policy "Anyone can read published blog posts" on public.blog_posts;
create policy "Anyone can read published blog posts"
on public.blog_posts for select to anon, authenticated
using (
  published
  and (published_at is null or published_at <= now())
  and (unpublish_at is null or unpublish_at > now())
);

-- Withdrawing a catalogue entry also withdraws its body from direct Data API
-- reads, not just the website's parent-service join. Admin preview access is
-- retained by the existing separate admin policy.
drop policy "Anyone can read published service pages" on public.service_pages;
create policy "Anyone can read published service pages"
on public.service_pages for select to anon, authenticated
using (
  published and exists (
    select 1 from public.services as parent
    where parent.id = service_pages.service_id and parent.published
  )
);

create table public.content_revisions (
  id uuid primary key default gen_random_uuid(),
  revision_number bigint generated always as identity unique,
  entity_table text not null check (entity_table in ('blog_posts', 'service_pages')),
  entity_id uuid not null,
  operation text not null check (operation in ('baseline', 'create', 'update', 'delete')),
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object'),
  actor_id uuid,
  created_at timestamptz not null default now()
);
create index content_revisions_entity_idx
  on public.content_revisions (entity_table, entity_id, revision_number desc);
alter table public.content_revisions enable row level security;
revoke all on public.content_revisions from public, anon, authenticated;
grant select on public.content_revisions to authenticated;
grant select on public.content_revisions to service_role;
create policy "Admins can read content revisions"
on public.content_revisions for select to authenticated
using ((select private.is_admin()));

-- The private trigger owns the only insert path. Direct API clients cannot
-- fabricate, overwrite or delete history, including authenticated admins.
-- SECURITY DEFINER is needed for append-only writes into the protected table;
-- it is not an exposed RPC and does not grant extra rights over source rows.
create function private.capture_content_revision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved jsonb;
begin
  if tg_table_schema <> 'public' or tg_table_name not in ('blog_posts', 'service_pages') then
    raise exception 'Unsupported content revision source';
  end if;
  if auth.uid() is not null and not private.is_admin() then
    raise exception 'Only administrators may write content revisions';
  end if;
  if tg_op = 'UPDATE' and
     (to_jsonb(new) - 'updated_at') = (to_jsonb(old) - 'updated_at') then
    return new;
  end if;
  saved := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  insert into public.content_revisions (entity_table, entity_id, operation, snapshot, actor_id)
  values (tg_table_name, (saved->>'id')::uuid,
    case tg_op when 'INSERT' then 'create' when 'UPDATE' then 'update' else 'delete' end,
    saved, auth.uid());
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
revoke all on function private.capture_content_revision() from public, anon, authenticated;

insert into public.content_revisions (entity_table, entity_id, operation, snapshot)
select 'blog_posts', id, 'baseline', to_jsonb(blog_posts) from public.blog_posts;
insert into public.content_revisions (entity_table, entity_id, operation, snapshot)
select 'service_pages', id, 'baseline', to_jsonb(service_pages) from public.service_pages;

create trigger blog_posts_capture_content_revision
after insert or update or delete on public.blog_posts
for each row execute function private.capture_content_revision();
create trigger service_pages_capture_content_revision
after insert or update or delete on public.service_pages
for each row execute function private.capture_content_revision();

-- Keep automatic slug history inside the same visibility boundary as articles.
create or replace function private.capture_slug_redirect()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  route_prefix text := tg_argv[0];
  redirect_kind text := tg_argv[1];
  old_path text;
  new_path text;
begin
  if old.slug is not distinct from new.slug then
    return new;
  end if;

  -- A service with a custom href (currently Police Station) never lived at
  -- /services/<slug>, so changing its catalogue key must not invent a URL.
  if tg_table_name = 'services' and nullif(new.content ->> 'href', '') is not null then
    return new;
  end if;

  old_path := route_prefix || old.slug;
  new_path := route_prefix || new.slug;

  -- Article recommendations store the public service path. Keep those links
  -- canonical even while a service is a draft, so republishing it cannot
  -- revive stale internal links.
  if tg_table_name = 'services' then
    update public.blog_posts
    set content = jsonb_set(content, '{relatedService}', to_jsonb(new_path), false)
    where content ->> 'relatedService' = old_path;
  end if;

  -- Never point visitors at a draft, which resolves as a 404 through public
  -- RLS, or expose a never-public draft slug. A redirect is captured only when
  -- the renamed row was published and remains published.
  if not old.published or not new.published then
    return new;
  end if;

  -- An enabled article is still private before its publication time or after
  -- expiry. Never publish its former slug or point public aliases at it.
  if tg_table_name = 'blog_posts' then
    if (old.published_at is not null and old.published_at > now())
       or (new.published_at is not null and new.published_at > now())
       or (old.unpublish_at is not null and old.unpublish_at <= now())
       or (new.unpublish_at is not null and new.unpublish_at <= now()) then
      return new;
    end if;
  end if;

  -- A path becoming canonical again must not remain a redirect source (the
  -- common case is reverting a previous rename).
  delete from public.redirects where source_path = new_path;

  -- Keep every older name one hop from the current canonical URL.
  update public.redirects
  set destination_path = new_path
  where destination_path = old_path;

  insert into public.redirects (
    source_path,
    destination_path,
    permanent,
    active,
    source_kind,
    source_entity_id
  )
  values (old_path, new_path, true, true, redirect_kind, new.id)
  on conflict (source_path) do update
  set destination_path = excluded.destination_path,
      permanent = true,
      active = true,
      source_kind = excluded.source_kind,
      source_entity_id = excluded.source_entity_id;

  return new;
end;
$$;

revoke all on function private.capture_slug_redirect()
from public, anon, authenticated;
