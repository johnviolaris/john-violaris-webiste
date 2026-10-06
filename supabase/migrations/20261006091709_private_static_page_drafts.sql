-- Private drafts are separate from the unchanged publicly readable live rows.
-- No current public content is copied, rewritten or unpublished by this migration.
create table public.page_section_drafts (
  id uuid primary key default gen_random_uuid(),
  page text not null check (page ~ '^[a-z][a-z0-9-]{0,63}$'),
  section text not null check (section ~ '^[a-z][a-z0-9-]{0,63}$'),
  content jsonb not null check (jsonb_typeof(content)='object'),
  base_content jsonb check (base_content is null or jsonb_typeof(base_content)='object'),
  version bigint not null default 1 check (version>0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(page,section)
);
alter table public.page_section_drafts enable row level security;
revoke all on public.page_section_drafts from public,anon,authenticated,service_role;
grant select,insert,update,delete on public.page_section_drafts to authenticated;
create policy "Admins can manage private section drafts"
on public.page_section_drafts for all to authenticated
using ((select private.is_admin())) with check ((select private.is_admin()));

create function private.touch_section_draft_version() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  new.version := old.version+1;
  new.updated_at := clock_timestamp();
  return new;
end;
$$;
revoke all on function private.touch_section_draft_version() from public,anon,authenticated,service_role;
create trigger page_section_drafts_touch_version before update on public.page_section_drafts
for each row execute function private.touch_section_draft_version();

alter table public.content_revisions drop constraint content_revisions_entity_table_check;
alter table public.content_revisions add constraint content_revisions_entity_table_check
check (entity_table in ('blog_posts','service_pages','page_sections','page_section_drafts','site_settings','seo_metadata','location_pages','media_assets','services','service_groups','blog_categories','testimonials'));
create or replace function private.capture_content_revision()
returns trigger language plpgsql security definer set search_path='' as $$
declare saved jsonb; saved_key text; saved_id uuid;
begin
  if tg_table_schema<>'public' or tg_table_name not in
    ('blog_posts','service_pages','page_sections','page_section_drafts','site_settings','seo_metadata','location_pages','media_assets','services','service_groups','blog_categories','testimonials') then
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
    when 'page_section_drafts' then (saved->>'page')||'/'||(saved->>'section')
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


create trigger page_section_drafts_capture_content_revision after insert or update or delete
on public.page_section_drafts for each row execute function private.capture_content_revision();

-- A single invoker transaction locks the section, rejects stale forms and
-- either saves a private draft or explicitly publishes/removes it atomically.
-- The application validates the current editable registry before invoking it.
create function public.save_page_section_content(
  p_page text,
  p_section text,
  p_content jsonb,
  p_intent text,
  p_expected_live_content jsonb,
  p_expected_draft_id uuid,
  p_expected_draft_version bigint
) returns jsonb language plpgsql security invoker set search_path='' as $$
declare
  live_content jsonb;
  saved_draft public.page_section_drafts%rowtype;
begin
  if not exists (select 1 from public.profiles where id=auth.uid() and role='admin') then
    raise exception using errcode='42501',message='Only administrators can manage section drafts';
  end if;
  if p_page is null or p_section is null or p_page !~ '^[a-z][a-z0-9-]{0,63}$'
    or p_section !~ '^[a-z][a-z0-9-]{0,63}$'
    or p_intent is null or p_intent not in ('draft','publish','discard','reset') then
    raise exception 'Choose a supported section action';
  end if;
  if p_intent in ('draft','publish') and
    (p_content is null or jsonb_typeof(p_content)<>'object' or octet_length(p_content::text)>262144) then
    raise exception 'The section content is invalid or too large';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_page||'/'||p_section,0));
  select content into live_content from public.page_sections
    where page=p_page and section=p_section for update;
  select * into saved_draft from public.page_section_drafts
    where page=p_page and section=p_section for update;
  if saved_draft.id is distinct from p_expected_draft_id
     or saved_draft.version is distinct from p_expected_draft_version then
    raise exception 'This draft changed in another session. Reload and compare before saving';
  end if;
  if p_intent<>'discard' and live_content is distinct from p_expected_live_content then
    raise exception 'The live section changed. Compare the versions or discard this draft and reload before publishing';
  end if;
  if p_intent<>'discard' and saved_draft.id is not null
     and saved_draft.base_content is distinct from p_expected_live_content then
    raise exception 'This draft was based on another live version. Discard it and reload before starting a new draft';
  end if;
  if p_intent='draft' then
    insert into public.page_section_drafts(page,section,content,base_content)
    values(p_page,p_section,p_content,live_content)
    on conflict(page,section) do update set content=excluded.content
    returning * into saved_draft;
    return jsonb_build_object('draft',to_jsonb(saved_draft),'live_content',live_content);
  end if;
  if p_intent='publish' then
    insert into public.page_sections(page,section,content) values(p_page,p_section,p_content)
    on conflict(page,section) do update set content=excluded.content;
    live_content := p_content;
  elsif p_intent='reset' then
    delete from public.page_sections where page=p_page and section=p_section;
    live_content := null;
  end if;
  delete from public.page_section_drafts where page=p_page and section=p_section;
  return jsonb_build_object('draft',null,'live_content',live_content);
end;
$$;
revoke all on function public.save_page_section_content(text,text,jsonb,text,jsonb,uuid,bigint)
from public,anon,authenticated,service_role;
grant execute on function public.save_page_section_content(text,text,jsonb,text,jsonb,uuid,bigint) to authenticated;
