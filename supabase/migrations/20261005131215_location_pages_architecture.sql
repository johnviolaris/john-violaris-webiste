-- Future location content starts empty. No city or office is invented here.
create table public.location_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  location text not null check (char_length(btrim(location)) between 1 and 100),
  title text not null check (char_length(btrim(title)) between 1 and 120),
  published boolean not null default false,
  reviewed_by uuid references public.profiles(id) on delete restrict,
  reviewed_at timestamptz,
  content jsonb not null default '{}'::jsonb check (jsonb_typeof(content) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint location_pages_review_gate check (
    not published or (
      reviewed_by is not null and reviewed_at is not null
      and jsonb_typeof(content->'localContext') = 'array'
      and jsonb_typeof(content->'body') = 'array'
      and coalesce(char_length(content->>'intro'), 0) >= 50
      and coalesce(char_length((content->'localContext')::text), 0) >= 400
      and coalesce(char_length((content->'body')::text), 0) >= 1800
      and coalesce(char_length(content->>'description'), 0) >= 40
    )
  )
);

create index location_pages_published_location_idx
  on public.location_pages (location) where published;

create trigger location_pages_touch_updated_at
  before update on public.location_pages
  for each row execute function private.touch_updated_at();

alter table public.redirects drop constraint redirects_source_kind_check;
alter table public.redirects add constraint redirects_source_kind_check
  check (source_kind in ('manual', 'blog_slug', 'service_slug', 'location_slug'));

create trigger location_pages_capture_slug_redirect
  after update of slug on public.location_pages
  for each row when (old.slug is distinct from new.slug)
  execute function private.capture_slug_redirect('/locations/', 'location_slug');

alter table public.location_pages enable row level security;
revoke all on table public.location_pages from public, anon, authenticated;
grant select on table public.location_pages to anon, authenticated;
grant insert, update, delete on table public.location_pages to authenticated;
grant select, insert, update, delete on table public.location_pages to service_role;

create policy "Anyone can read reviewed published locations"
on public.location_pages for select to anon, authenticated
using (published and reviewed_by is not null and reviewed_at is not null);

create policy "Admins can manage location pages"
on public.location_pages for all to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));
