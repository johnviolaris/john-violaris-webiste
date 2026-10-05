-- Adds an opt-in delegated SEO role. No existing user is promoted or modified.
alter table public.profiles drop constraint profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('user', 'admin', 'seo_editor'));

-- Admins retain the capability; SEO editors never inherit private.is_admin().
create function private.is_seo_editor()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role in ('admin', 'seo_editor')
  );
$$;
revoke all on function private.is_seo_editor() from public, anon, authenticated;
grant execute on function private.is_seo_editor() to authenticated;

create policy "SEO editors can manage metadata"
on public.seo_metadata for all to authenticated
using ((select private.is_seo_editor()))
with check ((select private.is_seo_editor()));

create policy "SEO editors can manage crawl rules only"
on public.site_settings for all to authenticated
using (key = 'robots' and (select private.is_seo_editor()))
with check (key = 'robots' and (select private.is_seo_editor()));

-- Draft-aware SEO forms must not make saved draft metadata public over REST.
-- A security-invoker check uses the caller's existing parent-content RLS;
-- authenticated SEO editors have their separate metadata policy above.
drop policy "Anyone can read seo metadata" on public.seo_metadata;
create policy "Anyone can read public route metadata"
on public.seo_metadata for select to anon, authenticated
using (
  path in ('/', '/about', '/services', '/police-station', '/fees', '/reviews',
    '/contact', '/cookies', '/privacy', '/blog')
  or exists (
    select 1 from public.services s
    join public.service_pages p on p.service_id = s.id
    where seo_metadata.path = '/services/' || s.slug
      and s.published and p.published and coalesce(s.content->>'href', '') = ''
  )
  or exists (
    select 1 from public.blog_posts b
    where seo_metadata.path = '/blog/' || b.slug and b.published
      and (b.published_at is null or b.published_at <= now())
      and (b.unpublish_at is null or b.unpublish_at > now())
  )
  or exists (
    select 1 from public.location_pages l
    where seo_metadata.path = '/locations/' || l.slug and l.published
      and l.reviewed_at is not null
  )
);
