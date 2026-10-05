-- Apply locally reviewed migrations before deploying the media/history UI.
alter table public.location_pages add column published_at timestamptz;
alter table public.location_pages add column unpublish_at timestamptz;
alter table public.location_pages add constraint location_pages_publication_window_check
check (unpublish_at is null or published_at is null or unpublish_at>published_at);
drop policy "Anyone can read reviewed published locations" on public.location_pages;
create policy "Anyone can read reviewed published locations" on public.location_pages
for select to anon,authenticated using (published and reviewed_by is not null and reviewed_at is not null
and (published_at is null or published_at<=now()) and (unpublish_at is null or unpublish_at>now()));
-- Existing URLs are immutable: edits never rename/delete a referenced object.
create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  url text not null unique,
  storage_path text unique,
  filename text not null check (filename ~ '^[a-z0-9]+(-[a-z0-9]+)*\.(jpg|png|webp|avif)$'),
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp','image/avif')),
  width integer not null check (width > 0 and width <= 20000),
  height integer not null check (height > 0 and height <= 20000),
  alt_text text not null default '' check (length(alt_text) <= 200),
  is_decorative boolean not null default false,
  title text not null default '' check (length(title) <= 160),
  caption text not null default '' check (length(caption) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint media_assets_description_check check (is_decorative or length(btrim(alt_text)) > 0)
);
alter table public.media_assets enable row level security;
revoke all on public.media_assets from public, anon, authenticated;
grant select on public.media_assets to anon, authenticated;
grant insert, update on public.media_assets to authenticated;
grant select, insert, update on public.media_assets to service_role;
create policy "Anyone can read image descriptions" on public.media_assets
for select to anon, authenticated using (
  url='/john-violaris-portrait.webp'
  or exists (select 1 from public.blog_posts b where b.published
    and (b.published_at is null or b.published_at<=now())
    and (b.unpublish_at is null or b.unpublish_at>now())
    and b.content->>'featuredImage'=media_assets.url)
  or exists (select 1 from public.page_sections p
    where p.page='home' and p.section='hero' and p.content->>'portrait'=media_assets.url)
);
create policy "Admins can manage image descriptions" on public.media_assets
for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create trigger media_assets_touch_updated_at before update on public.media_assets
for each row execute function private.touch_updated_at();
create function private.keep_media_url_stable() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  if (new.url,new.storage_path,new.filename,new.mime_type,new.width,new.height)
     is distinct from (old.url,old.storage_path,old.filename,old.mime_type,old.width,old.height) then
    raise exception 'Upload a new image instead of changing an existing served URL';
  end if;
  return new;
end;
$$;
revoke all on function private.keep_media_url_stable() from public,anon,authenticated;
create trigger media_assets_keep_url_stable before update on public.media_assets
for each row execute function private.keep_media_url_stable();

insert into public.media_assets(url,filename,mime_type,width,height,alt_text)
values ('/john-violaris-portrait.webp','john-violaris-portrait.webp','image/webp',1086,1448,
  coalesce((select nullif(content->>'portraitAlt','') from public.page_sections where page='home' and section='hero'),
    'Portrait of John Violaris, criminal defence solicitor'));

-- Retain UUID identifiers for existing callers, adding stable keys for sections
-- and key/value settings. A reset and a later re-create share the same history.
alter table public.content_revisions add column entity_key text;
update public.content_revisions set entity_key=entity_id::text;
alter table public.content_revisions alter column entity_key set not null;
alter table public.content_revisions alter column entity_id drop not null;
alter table public.content_revisions drop constraint content_revisions_entity_table_check;
alter table public.content_revisions add constraint content_revisions_entity_table_check
check (entity_table in ('blog_posts','service_pages','page_sections','site_settings','seo_metadata','location_pages','media_assets','services','service_groups','blog_categories','testimonials'));
create index content_revisions_entity_key_idx on public.content_revisions(entity_table,entity_key,revision_number desc);
drop policy "Admins can read content revisions" on public.content_revisions;
create policy "Editors can read permitted content revisions" on public.content_revisions
for select to authenticated using (
  (select private.is_admin()) or (
    (entity_table='seo_metadata' or (entity_table='site_settings' and entity_key='robots'))
    and (select private.is_seo_editor())
  )
);

create or replace function private.capture_content_revision()
returns trigger language plpgsql security definer set search_path='' as $$
declare saved jsonb; saved_key text; saved_id uuid;
begin
  if tg_table_schema<>'public' or tg_table_name not in
    ('blog_posts','service_pages','page_sections','site_settings','seo_metadata','location_pages','media_assets','services','service_groups','blog_categories','testimonials') then
    raise exception 'Unsupported content revision source';
  end if;
  saved := case when tg_op='DELETE' then to_jsonb(old) else to_jsonb(new) end;
  if auth.uid() is not null and not private.is_admin() and not (
      private.is_seo_editor() and (tg_table_name='seo_metadata' or
      (tg_table_name='site_settings' and saved->>'key'='robots'))) then
    raise exception 'Only permitted editors may write content revisions';
  end if;
  saved_id := case when tg_table_name='site_settings' then null else (saved->>'id')::uuid end;
  saved_key := case tg_table_name
    when 'site_settings' then saved->>'key'
    when 'page_sections' then (saved->>'page')||'/'||(saved->>'section')
    when 'seo_metadata' then saved->>'path'
    else saved_id::text end;
  insert into public.content_revisions(entity_table,entity_id,entity_key,operation,snapshot,actor_id)
  values(tg_table_name,saved_id,saved_key,
    case tg_op when 'INSERT' then 'create' when 'UPDATE' then 'update' else 'delete' end,
    saved,auth.uid());
  if tg_op='DELETE' then return old; end if; return new;
end;
$$;
revoke all on function private.capture_content_revision() from public,anon,authenticated;

insert into public.content_revisions(entity_table,entity_id,entity_key,operation,snapshot)
select 'page_sections',id,page||'/'||section,'baseline',to_jsonb(page_sections) from public.page_sections;
insert into public.content_revisions(entity_table,entity_key,operation,snapshot)
select 'site_settings',key,'baseline',to_jsonb(site_settings) from public.site_settings;
insert into public.content_revisions(entity_table,entity_id,entity_key,operation,snapshot)
select 'seo_metadata',id,path,'baseline',to_jsonb(seo_metadata) from public.seo_metadata;
insert into public.content_revisions(entity_table,entity_id,entity_key,operation,snapshot)
select 'location_pages',id,id::text,'baseline',to_jsonb(location_pages) from public.location_pages;
insert into public.content_revisions(entity_table,entity_id,entity_key,operation,snapshot)
select 'media_assets',id,id::text,'baseline',to_jsonb(media_assets) from public.media_assets;
insert into public.content_revisions(entity_table,entity_id,entity_key,operation,snapshot)
select 'services',id,id::text,'baseline',to_jsonb(services) from public.services;
insert into public.content_revisions(entity_table,entity_id,entity_key,operation,snapshot)
select 'service_groups',id,id::text,'baseline',to_jsonb(service_groups) from public.service_groups;
insert into public.content_revisions(entity_table,entity_id,entity_key,operation,snapshot)
select 'blog_categories',id,id::text,'baseline',to_jsonb(blog_categories) from public.blog_categories;
insert into public.content_revisions(entity_table,entity_id,entity_key,operation,snapshot)
select 'testimonials',id,id::text,'baseline',to_jsonb(testimonials) from public.testimonials;

create trigger page_sections_capture_content_revision after insert or update or delete on public.page_sections
for each row execute function private.capture_content_revision();
create trigger site_settings_capture_content_revision after insert or update or delete on public.site_settings
for each row execute function private.capture_content_revision();
create trigger seo_metadata_capture_content_revision after insert or update or delete on public.seo_metadata
for each row execute function private.capture_content_revision();
create trigger location_pages_capture_content_revision after insert or update or delete on public.location_pages
for each row execute function private.capture_content_revision();
create trigger media_assets_capture_content_revision after insert or update or delete on public.media_assets
for each row execute function private.capture_content_revision();
create trigger services_capture_content_revision after insert or update or delete on public.services
for each row execute function private.capture_content_revision();
create trigger service_groups_capture_content_revision after insert or update or delete on public.service_groups
for each row execute function private.capture_content_revision();
create trigger blog_categories_capture_content_revision after insert or update or delete on public.blog_categories
for each row execute function private.capture_content_revision();
create trigger testimonials_capture_content_revision after insert or update or delete on public.testimonials
for each row execute function private.capture_content_revision();
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
  if tg_table_name in ('blog_posts', 'location_pages') then
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
