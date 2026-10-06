-- Cadence planning is private and independent of publicly readable article JSON.
-- This creates no plans and does not update any existing article or revision.
create table public.article_review_plans (
  id uuid primary key default gen_random_uuid(),
  blog_post_id uuid not null unique references public.blog_posts(id) on delete cascade,
  interval_months smallint not null check (interval_months between 1 and 36),
  next_due_on date not null check (next_due_on between date '1900-01-01' and date '9999-12-31'),
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index article_review_plans_due_idx on public.article_review_plans(next_due_on,blog_post_id);
alter table public.article_review_plans enable row level security;
revoke all on public.article_review_plans from public,anon,authenticated,service_role;
grant select,insert,update,delete on public.article_review_plans to authenticated;
create policy "Only admins can manage article review plans"
on public.article_review_plans for all to authenticated
using ((select private.is_admin())) with check ((select private.is_admin()));

create function private.touch_article_review_plan() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  -- Identity and generation cannot be reset by an update, including a raw API edit.
  new.id := old.id;
  new.blog_post_id := old.blog_post_id;
  new.created_at := old.created_at;
  new.version := old.version + 1;
  new.updated_at := clock_timestamp();
  return new;
end;
$$;
revoke all on function private.touch_article_review_plan() from public,anon,authenticated,service_role;
create trigger article_review_plans_touch before update on public.article_review_plans
for each row execute function private.touch_article_review_plan();

create function public.save_article_review_plan(
  p_blog_post_id uuid, p_intent text, p_interval_months integer, p_next_due_on date,
  p_expected_id uuid, p_expected_version bigint
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare saved public.article_review_plans;
begin
  -- Use the caller's RLS-readable profile inside the invoker; do not expand
  -- private-schema USAGE rights. Table policies independently check is_admin.
  if not exists(select 1 from public.profiles where id=(select auth.uid()) and role='admin') then
    raise exception 'Administrator access required' using errcode='42501';
  end if;
  if p_intent is null or p_intent not in ('save','clear') then
    raise exception 'Invalid review planning action' using errcode='22023';
  end if;
  if p_blog_post_id is null or (p_expected_id is null) <> (p_expected_version is null)
     or p_expected_version <= 0 then
    raise exception 'Reload this article before changing its review plan' using errcode='22023';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('article-review:' || p_blog_post_id::text,0));
  if not exists(select 1 from public.blog_posts where id=p_blog_post_id) then
    raise exception 'The article is no longer available. Reload the article list';
  end if;
  select * into saved from public.article_review_plans where blog_post_id=p_blog_post_id for update;
  if saved.id is distinct from p_expected_id or saved.version is distinct from p_expected_version then
    raise exception 'This review plan changed in another session. Reload and compare before saving';
  end if;
  if p_intent='clear' then
    delete from public.article_review_plans where blog_post_id=p_blog_post_id;
    return null;
  end if;
  if p_interval_months is null or p_interval_months not between 1 and 36
     or p_next_due_on is null or p_next_due_on not between date '1900-01-01' and date '9999-12-31' then
    raise exception 'Choose an interval from 1 to 36 months and a valid calendar date' using errcode='23514';
  end if;
  insert into public.article_review_plans(blog_post_id,interval_months,next_due_on)
  values(p_blog_post_id,p_interval_months,p_next_due_on)
  on conflict(blog_post_id) do update set interval_months=excluded.interval_months,next_due_on=excluded.next_due_on
  returning * into saved;
  return to_jsonb(saved);
end;
$$;
revoke all on function public.save_article_review_plan(uuid,text,integer,date,uuid,bigint)
from public,anon,authenticated,service_role;
grant execute on function public.save_article_review_plan(uuid,text,integer,date,uuid,bigint) to authenticated;
