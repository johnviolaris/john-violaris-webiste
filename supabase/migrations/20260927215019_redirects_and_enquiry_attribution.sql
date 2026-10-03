/*
 * URL redirects and enquiry attribution.
 *
 * Redirects are public routing facts, but only an administrator may change
 * them. Slug-history redirects are captured inside the same transaction as a
 * blog post or service rename, so a successful rename cannot leave its former
 * URL behind. All destinations are same-site paths; the validation trigger
 * collapses redirect chains and rejects loops before they can be stored.
 *
 * Enquiry attribution is deliberately narrow: an external referrer with no
 * query string, plus the five standard UTM values and Google Ads click id. The
 * form action normalises and length-limits every value before these nullable
 * columns are written.
 */

create table public.redirects (
  source_path text primary key,
  destination_path text not null,
  permanent boolean not null default true,
  active boolean not null default true,
  source_kind text not null default 'manual',
  source_entity_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint redirects_source_path_check check (
    char_length(source_path) between 2 and 512
    and source_path ~ '^/[A-Za-z0-9._~%+/-]+$'
    and source_path not like '//%'
  ),
  constraint redirects_destination_path_check check (
    char_length(destination_path) between 1 and 512
    and destination_path ~ '^/[A-Za-z0-9._~%+/-]*$'
    and destination_path not like '//%'
  ),
  constraint redirects_distinct_paths_check check (source_path <> destination_path),
  constraint redirects_source_kind_check check (
    source_kind in ('manual', 'blog_slug', 'service_slug')
  )
);

-- Used when a canonical path changes: every older alias pointing at the old
-- canonical is rewritten directly to the new one.
create index redirects_destination_path_idx
  on public.redirects (destination_path);

create trigger redirects_touch_updated_at
  before update on public.redirects
  for each row execute function private.touch_updated_at();


-- ---------------------------------------------------------------------------
-- Redirect validation and chain flattening
-- ---------------------------------------------------------------------------

create function private.validate_redirect_path()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  resolved_path text := new.destination_path;
  next_path text;
  visited text[] := array[new.source_path];
  hop integer;
begin
  if tg_op = 'UPDATE' then
    if old.source_path is distinct from new.source_path then
      raise exception using
        errcode = '23514',
        message = 'a redirect source path is immutable; replace the row instead';
    end if;
  end if;

  /*
   * Follow any existing destination to its final target. The source path is
   * seeded into `visited`, so pointing back to it is rejected as a loop.
   * Thirty-two hops is defensive; rows are flattened after every write, so a
   * healthy table never needs more than one.
   */
  for hop in 1..32 loop
    if resolved_path = any(visited) then
      raise exception using
        errcode = '23514',
        message = 'redirects may not contain a loop';
    end if;

    visited := array_append(visited, resolved_path);
    next_path := null;

    select r.destination_path
    into next_path
    from public.redirects as r
    where r.source_path = resolved_path
      and r.active
      and r.source_path <> new.source_path
    limit 1;

    if next_path is null then
      new.destination_path := resolved_path;
      return new;
    end if;

    resolved_path := next_path;
  end loop;

  raise exception using
    errcode = '54001',
    message = 'redirect chain exceeds the supported depth';
end;
$$;

revoke all on function private.validate_redirect_path()
from public, anon, authenticated;

create function private.flatten_redirect_dependents()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- If /a -> /b already exists and /b -> /c is added later, store /a -> /c.
  update public.redirects
  set destination_path = new.destination_path
  where destination_path = new.source_path
    and source_path <> new.source_path;

  return null;
end;
$$;

revoke all on function private.flatten_redirect_dependents()
from public, anon, authenticated;

create trigger redirects_validate_path
  before insert or update of source_path, destination_path, active
  on public.redirects
  for each row execute function private.validate_redirect_path();

create trigger redirects_flatten_dependents
  after insert or update of source_path, destination_path
  on public.redirects
  for each row execute function private.flatten_redirect_dependents();


-- ---------------------------------------------------------------------------
-- Automatic redirect capture for editable slugs
-- ---------------------------------------------------------------------------

create function private.capture_slug_redirect()
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

create trigger blog_posts_capture_slug_redirect
  after update of slug on public.blog_posts
  for each row
  when (old.slug is distinct from new.slug)
  execute function private.capture_slug_redirect('/blog/', 'blog_slug');

create trigger services_capture_slug_redirect
  after update of slug on public.services
  for each row
  when (old.slug is distinct from new.slug)
  execute function private.capture_slug_redirect('/services/', 'service_slug');


-- ---------------------------------------------------------------------------
-- Row-level security and explicit Data API grants
-- ---------------------------------------------------------------------------

alter table public.redirects enable row level security;

revoke all on table public.redirects from public, anon, authenticated;
grant select on table public.redirects to anon, authenticated;
grant insert, update, delete on table public.redirects to authenticated;
grant select, insert, update, delete on table public.redirects to service_role;

create policy "Anyone can read active redirects"
on public.redirects for select
to anon, authenticated
using (active);

create policy "Admins can read all redirects"
on public.redirects for select
to authenticated
using ((select private.is_admin()));

create policy "Admins can create redirects"
on public.redirects for insert
to authenticated
with check ((select private.is_admin()));

create policy "Admins can update redirects"
on public.redirects for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "Admins can delete redirects"
on public.redirects for delete
to authenticated
using ((select private.is_admin()));


-- ---------------------------------------------------------------------------
-- Privacy-bounded enquiry attribution
-- ---------------------------------------------------------------------------

alter table public.enquiries
  add column referrer text,
  add column utm_source text,
  add column utm_medium text,
  add column utm_campaign text,
  add column utm_term text,
  add column utm_content text,
  add column gclid text,
  add constraint enquiries_referrer_length_check check (
    referrer is null or char_length(referrer) <= 500
  ),
  add constraint enquiries_utm_source_length_check check (
    utm_source is null or char_length(utm_source) <= 200
  ),
  add constraint enquiries_utm_medium_length_check check (
    utm_medium is null or char_length(utm_medium) <= 200
  ),
  add constraint enquiries_utm_campaign_length_check check (
    utm_campaign is null or char_length(utm_campaign) <= 200
  ),
  add constraint enquiries_utm_term_length_check check (
    utm_term is null or char_length(utm_term) <= 200
  ),
  add constraint enquiries_utm_content_length_check check (
    utm_content is null or char_length(utm_content) <= 200
  ),
  add constraint enquiries_gclid_length_check check (
    gclid is null or char_length(gclid) <= 200
  );

