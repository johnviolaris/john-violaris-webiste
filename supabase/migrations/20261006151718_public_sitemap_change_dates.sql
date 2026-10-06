-- Date evidence only. No public content, source snapshots or roles are changed.
-- Live section/SEO changes survive a reset; private draft writes are excluded.
create table private.sitemap_change_dates (
  path text primary key check (path = '/' or path ~ '^/[a-z0-9]+(-[a-z0-9]+)*(/[a-z0-9]+(-[a-z0-9]+)*)*$'),
  modified_at timestamptz not null check (isfinite(modified_at))
);
alter table private.sitemap_change_dates enable row level security;
revoke all on private.sitemap_change_dates from public, anon, authenticated, service_role;

-- Mirrors the actual fixed-page CMS dependencies, not the CTA's wider label.
-- Keep in sync with the section registry; the offline SQL suite compares every
-- registry entry. Unknown section keys have no public date effect.
create function private.sitemap_section_paths(p_page text, p_section text)
returns text[] language sql immutable security invoker set search_path = '' as $$
  select coalesce((select paths from (values
    ('home','hero',array['/']),
    ('home','offence-strip',array['/']),
    ('home','why-instruct',array['/']),
    ('home','testimonials',array['/']),
    ('about','intro',array['/about']),
    ('about','meet-john',array['/','/about']),
    ('about','background',array['/about']),
    ('about','career',array['/about']),
    ('services','intro',array['/services']),
    ('services','explorer',array['/','/services']),
    ('police-station','intro',array['/police-station']),
    ('police-station','feature',array['/','/police-station']),
    ('police-station','detail',array['/police-station']),
    ('police-station','stages',array['/police-station']),
    ('fees','intro',array['/fees']),
    ('fees','body',array['/fees']),
    ('fees','stages',array['/fees']),
    ('fees','preview',array['/','/fees']),
    ('reviews','intro',array['/reviews']),
    ('cookies','intro',array['/cookies']),
    ('privacy','intro',array['/privacy']),
    ('contact','intro',array['/contact']),
    ('contact','details',array['/contact']),
    ('contact','prepare',array['/contact']),
    ('shared','process',array['/','/about']),
    ('shared','cta',array['/','/about','/services','/police-station','/fees','/reviews','/cookies','/privacy'])
  ) as registered(page,section,paths) where page=p_page and section=p_section),array[]::text[]);
$$;
revoke all on function private.sitemap_section_paths(text,text) from public,anon,authenticated,service_role;

-- Explicit parent checks run even inside a definer: an admin's broader RLS
-- access must not make private routes public. Custom catalogue hrefs have no
-- /services/<slug> route, and locations also require review and live windows.
create function private.is_public_sitemap_path(p_path text)
returns boolean language sql stable security invoker set search_path = '' as $$
  select p_path in ('/','/about','/services','/police-station','/fees','/reviews','/contact','/cookies','/privacy','/blog')
    or exists (select 1 from public.services s join public.service_pages p on p.service_id=s.id
      where p_path='/services/'||s.slug and s.published and p.published and coalesce(s.content->>'href','')='')
    or exists (select 1 from public.blog_posts b where p_path='/blog/'||b.slug and b.published
      and (b.published_at is null or b.published_at<=now()) and (b.unpublish_at is null or b.unpublish_at>now()))
    or exists (select 1 from public.location_pages l where p_path='/locations/'||l.slug and l.published
      and l.reviewed_by is not null and l.reviewed_at is not null
      and (l.published_at is null or l.published_at<=now()) and (l.unpublish_at is null or l.unpublish_at>now()));
$$;
revoke all on function private.is_public_sitemap_path(text) from public,anon,authenticated,service_role;

create function private.capture_sitemap_change_date()
returns trigger language plpgsql security definer set search_path = '' as $$
declare old_paths text[] := array[]::text[]; new_paths text[] := array[]::text[];
begin
  if tg_table_schema<>'public' or tg_table_name not in ('page_sections','seo_metadata') then
    raise exception 'Unsupported public date source';
  end if;
  if tg_op='UPDATE' and new.content is not distinct from old.content and
    ((tg_table_name='page_sections' and (to_jsonb(new)->>'page',to_jsonb(new)->>'section') is not distinct from (to_jsonb(old)->>'page',to_jsonb(old)->>'section'))
      or (tg_table_name='seo_metadata' and to_jsonb(new)->>'path' is not distinct from to_jsonb(old)->>'path')) then
    return new;
  end if;
  if tg_table_name='page_sections' then
    if tg_op<>'INSERT' then old_paths := private.sitemap_section_paths(old.page,old.section); end if;
    if tg_op<>'DELETE' then new_paths := private.sitemap_section_paths(new.page,new.section); end if;
  else
    if tg_op<>'INSERT' and private.is_public_sitemap_path(old.path) then old_paths := array[old.path]; end if;
    if tg_op<>'DELETE' and private.is_public_sitemap_path(new.path) then new_paths := array[new.path]; end if;
  end if;
  insert into private.sitemap_change_dates(path,modified_at)
    select path,clock_timestamp() from (select distinct unnest(old_paths||new_paths) as path) as affected
  on conflict(path) do update set modified_at=greatest(private.sitemap_change_dates.modified_at,excluded.modified_at);
  if tg_op='DELETE' then return old; end if; return new;
end;
$$;
revoke all on function private.capture_sitemap_change_date() from public,anon,authenticated,service_role;
create trigger page_sections_capture_sitemap_date after insert or update or delete on public.page_sections
for each row execute function private.capture_sitemap_change_date();
create trigger seo_metadata_capture_sitemap_date after insert or update or delete on public.seo_metadata
for each row execute function private.capture_sitemap_change_date();

-- Current live baselines use their original updated_at, never migration time.
-- Only provably public historical deletions are reconstructed. Dynamic SEO
-- snapshots lack historical parent visibility, so their old deletions remain
-- unknown. Private section draft history is never read by this backfill.
insert into private.sitemap_change_dates(path,modified_at)
select path,max(modified_at) from (
  select unnest(private.sitemap_section_paths(p.page,p.section)) as path,p.updated_at as modified_at
    from public.page_sections p
  union all
  select m.path,m.updated_at from public.seo_metadata m where private.is_public_sitemap_path(m.path)
  union all
  select unnest(private.sitemap_section_paths(r.snapshot->>'page',r.snapshot->>'section')),r.created_at
    from public.content_revisions r where r.entity_table='page_sections' and r.operation='delete'
  union all
  select r.snapshot->>'path',r.created_at from public.content_revisions r
    where r.entity_table='seo_metadata' and r.operation='delete'
      and r.snapshot->>'path' in ('/','/about','/services','/police-station','/fees','/reviews','/contact','/cookies','/privacy','/blog')
) as evidence where modified_at is not null and isfinite(modified_at) and modified_at<=clock_timestamp()
group by path
on conflict(path) do update set modified_at=greatest(private.sitemap_change_dates.modified_at,excluded.modified_at);

-- This is deliberately public date evidence, not a history-reading API. Its
-- definer is required only to read the private watermark. No arguments, dynamic
-- SQL, write path, audit snapshots, actor IDs, source values or private routes.
create function public.get_sitemap_change_dates()
returns table(path text,modified_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select d.path,d.modified_at from private.sitemap_change_dates d
    where private.is_public_sitemap_path(d.path) and d.modified_at<=clock_timestamp()
    order by d.path;
$$;
revoke all on function public.get_sitemap_change_dates() from public,anon,authenticated,service_role;
grant execute on function public.get_sitemap_change_dates() to anon,authenticated;
