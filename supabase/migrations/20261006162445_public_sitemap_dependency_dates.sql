-- Complementary public date evidence only: no public row, history or role edits.
-- Unknown deployment defaults and unproved historical references stay unknown.
create or replace function private.is_public_sitemap_path(p_path text)
returns boolean language sql stable security invoker set search_path='' as $$
  select p_path in ('/','/about','/services','/police-station','/fees','/reviews','/contact','/cookies','/privacy','/blog')
    or exists(select 1 from public.services s where p_path='/services/'||s.slug
      and s.published and s.slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
      -- A missing/null href uses the offence route. An explicit custom/empty
      -- href does not; no public static child currently reserves a slug.
      and s.content->>'href' is null)
    or exists(select 1 from public.blog_posts b where p_path='/blog/'||b.slug
      and b.slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and b.published
      and (b.published_at is null or b.published_at<=now()) and (b.unpublish_at is null or b.unpublish_at>now()))
    or exists(select 1 from public.location_pages l where p_path='/locations/'||l.slug
      and l.slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and l.published
      and l.reviewed_by is not null and l.reviewed_at is not null
      and (l.published_at is null or l.published_at<=now()) and (l.unpublish_at is null or l.unpublish_at>now()));
$$;
revoke all on function private.is_public_sitemap_path(text) from public,anon,authenticated,service_role;

-- Route existence is broader than anonymous SEO-source visibility for fallback
-- services. Preserve the existing metadata RLS boundary, rather than dating a
-- hidden override just because its catalogue route has public fallback copy.
create function private.is_public_sitemap_seo_source(p_path text)
returns boolean language sql stable security invoker set search_path='' as $$
  select private.is_public_sitemap_path(p_path) and (p_path not like '/services/%' or exists(
    select 1 from public.services s join public.service_pages p on p.service_id=s.id
    where p_path='/services/'||s.slug and s.published and p.published and s.content->>'href' is null));
$$;
revoke all on function private.is_public_sitemap_seo_source(text) from public,anon,authenticated,service_role;
create or replace function private.capture_sitemap_change_date()
returns trigger language plpgsql security definer set search_path='' as $$
declare old_paths text[]:=array[]::text[]; new_paths text[]:=array[]::text[];
begin
  if tg_table_schema<>'public' or tg_table_name not in ('page_sections','seo_metadata') then raise exception 'Unsupported public date source'; end if;
  if tg_op='UPDATE' and new.content is not distinct from old.content and
    ((tg_table_name='page_sections' and (to_jsonb(new)->>'page',to_jsonb(new)->>'section') is not distinct from (to_jsonb(old)->>'page',to_jsonb(old)->>'section'))
    or (tg_table_name='seo_metadata' and to_jsonb(new)->>'path' is not distinct from to_jsonb(old)->>'path')) then return new; end if;
  if tg_table_name='page_sections' then
    if tg_op<>'INSERT' then old_paths:=private.sitemap_section_paths(old.page,old.section); end if;
    if tg_op<>'DELETE' then new_paths:=private.sitemap_section_paths(new.page,new.section); end if;
  else
    if tg_op<>'INSERT' and private.is_public_sitemap_seo_source(old.path) then old_paths:=array[old.path]; end if;
    if tg_op<>'DELETE' and private.is_public_sitemap_seo_source(new.path) then new_paths:=array[new.path]; end if;
  end if;
  insert into private.sitemap_change_dates(path,modified_at) select path,clock_timestamp() from (select distinct unnest(old_paths||new_paths) as path) affected
  on conflict(path) do update set modified_at=greatest(private.sitemap_change_dates.modified_at,excluded.modified_at);
  if tg_op='DELETE' then return old; end if; return new;
end;
$$;
revoke all on function private.capture_sitemap_change_date() from public,anon,authenticated,service_role;

create function private.sitemap_public_paths()
returns setof text language sql stable security invoker set search_path='' as $$
  select path from (select unnest(array['/','/about','/services','/police-station','/fees','/reviews','/contact','/cookies','/privacy','/blog']) as path
    union select '/services/'||slug from public.services
    union select '/blog/'||slug from public.blog_posts
    union select '/locations/'||slug from public.location_pages) as candidates
  where private.is_public_sitemap_path(path);
$$;
revoke all on function private.sitemap_public_paths() from public,anon,authenticated,service_role;

-- Fixed defaults mirror resolveSiteConfig. Env-derived phone defaults cannot
-- be reconstructed in SQL and are deliberately not invented here.
create function private.sitemap_setting_default(p_key text)
returns text language sql immutable security invoker set search_path='' as $$
  select case p_key when 'name' then 'John Violaris' when 'role' then 'Criminal Defence Solicitor'
    when 'initials' then 'JV' when 'jurisdiction' then 'England & Wales'
    when 'email' then 'contact@johnviolaris.com' when 'responseTime' then 'Response within 24 hours'
    when 'sraNumber' then '' when 'qualifiedYear' then '2005'
    when 'reviewSolicitorsUrl' then 'https://www.reviewsolicitors.co.uk/london/london/ioannis-violaris'
    when 'lawSocietyUrl' then '' when 'linkedinUrl' then '' end;
$$;
revoke all on function private.sitemap_setting_default(text) from public,anon,authenticated,service_role;

create function private.sitemap_string(p_value jsonb)
returns text language sql immutable security invoker set search_path='' as $$
  -- ECMAScript String.trim(), including line/tab and Unicode whitespace/BOM.
  select case when jsonb_typeof(p_value)='string' then nullif(btrim(p_value#>>'{}',
    chr(9)||chr(10)||chr(11)||chr(12)||chr(13)||chr(32)||chr(160)||chr(5760)||
    chr(8192)||chr(8193)||chr(8194)||chr(8195)||chr(8196)||chr(8197)||chr(8198)||chr(8199)||chr(8200)||chr(8201)||chr(8202)||
    chr(8232)||chr(8233)||chr(8239)||chr(8287)||chr(12288)||chr(65279)),'') end;
$$;
revoke all on function private.sitemap_string(jsonb) from public,anon,authenticated,service_role;

create function private.sitemap_whatsapp(p_value jsonb)
returns text language plpgsql immutable security invoker set search_path='' as $$
declare digits text:=regexp_replace(coalesce(private.sitemap_string(p_value),''),'[^0-9]','','g');
begin
  if left(digits,2)='00' then digits:=substr(digits,3); end if;
  if left(digits,1)='0' then digits:='44'||substr(digits,2); end if;
  return case when length(digits) between 8 and 15 then digits end;
end;
$$;
revoke all on function private.sitemap_whatsapp(jsonb) from public,anon,authenticated,service_role;

create function private.sitemap_setting_is_used(p_key text,p_value jsonb)
returns boolean language sql stable security invoker set search_path='' as $$
  -- Preserve legacy string-row date evidence at fixed public keys even when
  -- the current value resolves to a default. This original metadata is not a
  -- claim of a proved significant past edit; forward capture is stricter.
  select (private.sitemap_setting_default(p_key) is not null and jsonb_typeof(p_value)='string') or
    (private.sitemap_string(p_value) is not null and (p_key='phoneE164'
    or (p_key='phoneDisplay' and exists(select 1 from public.site_settings where key='phoneE164' and private.sitemap_string(value) is not null))
    or (p_key='whatsappNumber' and private.sitemap_whatsapp(p_value) is not null)));
$$;
revoke all on function private.sitemap_setting_is_used(text,jsonb) from public,anon,authenticated,service_role;

-- Normalised render values: hidden decorative alt and an empty caption's format
-- cannot change a rendered image. Missing metadata restores the per-use copy.
create function private.sitemap_image_value(p_asset jsonb,p_content jsonb,p_hero boolean)
returns jsonb language sql immutable security invoker set search_path='' as $$
  select jsonb_build_array(alt,title,caption,case when caption<>'' then format end) from (
    select case when p_asset is not null then case when (p_asset->>'is_decorative')::boolean then '' else coalesce(p_asset->>'alt_text','') end
      when p_hero then coalesce(p_content->>'portraitAlt','Portrait of John Violaris, criminal defence solicitor') else coalesce(p_content->>'featuredImageAlt','') end as alt,
    case when p_asset is not null then coalesce(p_asset->>'title','') when p_hero then coalesce(p_content->>'portraitTitle','') else coalesce(p_content->>'featuredImageTitle','') end as title,
    case when p_asset is not null then coalesce(p_asset->>'caption','') when p_hero then coalesce(p_content->>'portraitCaption','') else coalesce(p_content->>'featuredImageCaption','') end as caption,
    case when p_asset is not null then coalesce(p_asset->>'caption_format','plain') when p_hero then coalesce(p_content->>'portraitCaptionFormat','plain') else coalesce(p_content->>'featuredImageCaptionFormat','plain') end as format
  ) as presentation;
$$;
revoke all on function private.sitemap_image_value(jsonb,jsonb,boolean) from public,anon,authenticated,service_role;

-- Reconstruct one changed row's before/after membership without exposing it.
create function private.sitemap_article_rows(p_id uuid,p_replacement jsonb)
returns setof public.blog_posts language sql stable security invoker set search_path='' as $$
  select b.* from public.blog_posts b where b.id is distinct from p_id
  union all select replacement.* from jsonb_populate_record(null::public.blog_posts,p_replacement) replacement where p_replacement is not null;
$$;
revoke all on function private.sitemap_article_rows(uuid,jsonb) from public,anon,authenticated,service_role;

create function private.sitemap_article_live(p_row public.blog_posts)
returns boolean language sql stable security invoker set search_path='' as $$
  select p_row.published and p_row.slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    and (p_row.published_at is null or p_row.published_at<=now()) and (p_row.unpublish_at is null or p_row.unpublish_at>now());
$$;
revoke all on function private.sitemap_article_live(public.blog_posts) from public,anon,authenticated,service_role;

create function private.sitemap_article_cards(p_id uuid,p_replacement jsonb)
returns jsonb language sql stable security invoker set search_path='' as $$
  select coalesce(jsonb_agg(jsonb_build_array(b.slug,b.title,b.category_id,b.content->'excerpt',b.content->'readTime',b.content->'icon',b.published_at,b.created_at) order by b.slug),'[]'::jsonb)
  from private.sitemap_article_rows(p_id,p_replacement) b where private.sitemap_article_live(b);
$$;
revoke all on function private.sitemap_article_cards(uuid,jsonb) from public,anon,authenticated,service_role;

create function private.sitemap_article_links(p_peer uuid,p_id uuid,p_replacement jsonb)
returns jsonb language sql stable security invoker set search_path='' as $$
  with candidates as(select b.* from private.sitemap_article_rows(p_id,p_replacement) b where b.id<>p_peer and private.sitemap_article_live(b)),
  selected as(select slug,title,published_at,created_at from candidates order by published_at desc nulls last,created_at desc limit 3)
  -- The app has no final tie-breaker. Do not pretend to know link selection if
  -- equal ordering timestamps leave it ambiguous; /blog membership still dates.
  select case when exists(select 1 from candidates group by published_at,created_at having count(*)>1) then null
    else coalesce((select jsonb_agg(jsonb_build_array(slug,title) order by published_at desc nulls last,created_at desc) from selected),'[]'::jsonb) end;
$$;
revoke all on function private.sitemap_article_links(uuid,uuid,jsonb) from public,anon,authenticated,service_role;

create function private.sitemap_location_live(p_row public.location_pages)
returns boolean language sql stable security invoker set search_path='' as $$
  select p_row.published and p_row.slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and p_row.reviewed_by is not null and p_row.reviewed_at is not null
    and (p_row.published_at is null or p_row.published_at<=now()) and (p_row.unpublish_at is null or p_row.unpublish_at>now());
$$;
revoke all on function private.sitemap_location_live(public.location_pages) from public,anon,authenticated,service_role;

create function private.sitemap_location_links(p_peer uuid,p_refs jsonb,p_id uuid,p_replacement jsonb)
returns jsonb language sql stable security invoker set search_path='' as $$
  with rows_before as(select l.* from public.location_pages l where l.id is distinct from p_id
    union all select replacement.* from jsonb_populate_record(null::public.location_pages,p_replacement) replacement where p_replacement is not null),
  candidates as(select l.* from rows_before l where private.sitemap_location_live(l)),
  selected as(select * from candidates order by location limit 500),
  links as(select slug,title,location from selected where id<>p_peer and p_refs ? ('/locations/'||slug))
  select case when exists(select 1 from candidates group by location having count(*)>1) then null
    else coalesce((select jsonb_agg(jsonb_build_array(slug,title) order by location) from links),'[]'::jsonb) end;
$$;
revoke all on function private.sitemap_location_links(uuid,jsonb,uuid,jsonb) from public,anon,authenticated,service_role;

create function private.sitemap_truthy(p_value jsonb)
returns boolean language sql immutable security invoker set search_path='' as $$
  select p_value is not null and p_value not in ('null'::jsonb,'false'::jsonb,'0'::jsonb,'""'::jsonb);
$$;
revoke all on function private.sitemap_truthy(jsonb) from public,anon,authenticated,service_role;
create function private.sitemap_service_global(p_row jsonb)
returns jsonb language sql immutable security invoker set search_path='' as $$
  select case when (p_row->>'published')::boolean then jsonb_build_array(p_row->'name',
    coalesce(p_row->'content'->>'href','/services/'||(p_row->>'slug')),p_row->'content'->'group',p_row->'content'->'icon',
    case when private.sitemap_truthy(p_row->'content'->'statute') then p_row->'content'->'statute' end) end;
$$;
revoke all on function private.sitemap_service_global(jsonb) from public,anon,authenticated,service_role;
create function private.sitemap_service_featured(p_row jsonb)
returns jsonb language sql immutable security invoker set search_path='' as $$
  select case when (p_row->>'published')::boolean and private.sitemap_truthy(p_row->'content'->'featured') then
    jsonb_build_array(coalesce(p_row->'content'->>'href','/services/'||(p_row->>'slug')),
      case when private.sitemap_truthy(p_row->'content'->'short') then p_row->'content'->>'short' else p_row->>'name' end) end;
$$;
revoke all on function private.sitemap_service_featured(jsonb) from public,anon,authenticated,service_role;
create function private.sitemap_service_card_intro(p_row jsonb)
returns text language sql immutable security invoker set search_path='' as $$
  select case when (p_row->>'published')::boolean then case when private.sitemap_truthy(p_row->'content'->'intro') then p_row->'content'->>'intro'
    else 'Personal advice and representation, with a clear explanation of your options at every stage.' end end;
$$;
revoke all on function private.sitemap_service_card_intro(jsonb) from public,anon,authenticated,service_role;
create function private.sitemap_service_page_intro(p_row jsonb)
returns text language sql immutable security invoker set search_path='' as $$
  select case when (p_row->>'published')::boolean then case when private.sitemap_truthy(p_row->'content'->'intro') then p_row->'content'->>'intro'
    else 'Personal advice and representation from John Violaris, across England and Wales.' end end;
$$;
revoke all on function private.sitemap_service_page_intro(jsonb) from public,anon,authenticated,service_role;

create function private.capture_sitemap_dependency_date()
returns trigger language plpgsql security definer set search_path='' as $$
declare before_row jsonb; after_row jsonb; key text; old_value text; new_value text; paths text[]:=array[]::text[];
  peer record; hero jsonb; portrait text; before_image jsonb; after_image jsonb; old_live boolean:=false; new_live boolean:=false;
  before_links jsonb; after_links jsonb; changed_id uuid; image_url text; old_asset jsonb; new_asset jsonb;
begin
  if tg_table_schema<>'public' or tg_table_name not in ('site_settings','media_assets','services','blog_posts','location_pages') then raise exception 'Unsupported public dependency date source'; end if;
  if tg_op<>'INSERT' then before_row:=to_jsonb(old); end if;
  if tg_op<>'DELETE' then after_row:=to_jsonb(new); end if;
  if tg_table_name='site_settings' then
    -- A key rename is two independent source events; defaults are key-specific.
    for key in select distinct unnest(array[before_row->>'key',after_row->>'key']) loop
      if key is null then continue; end if;
      old_value:=private.sitemap_string(case when before_row->>'key'=key then before_row->'value' end);
      new_value:=private.sitemap_string(case when after_row->>'key'=key then after_row->'value' end);
      if private.sitemap_setting_default(key) is not null then
        if coalesce(old_value,private.sitemap_setting_default(key)) is not distinct from coalesce(new_value,private.sitemap_setting_default(key)) then continue; end if;
      elsif key in ('phoneE164','phoneDisplay','whatsappNumber') then
        -- Empty/absent values fall back to unknown deployment environment.
        if old_value is null or new_value is null then continue; end if;
        if key='phoneDisplay' and not exists(select 1 from public.site_settings s where s.key='phoneE164' and private.sitemap_string(s.value) is not null) then continue; end if;
        if key='whatsappNumber' then
          old_value:=private.sitemap_whatsapp(to_jsonb(old_value)); new_value:=private.sitemap_whatsapp(to_jsonb(new_value));
          if old_value is null or new_value is null then continue; end if;
        end if;
        if old_value is not distinct from new_value then continue; end if;
      else continue; end if;
      if key='initials' then paths:=paths||array['/']; else paths:=paths||array(select private.sitemap_public_paths()); end if;
    end loop;
  elsif tg_table_name='media_assets' then
    select content into hero from public.page_sections where page='home' and section='hero';
    portrait:=case when jsonb_typeof(hero->'portrait')='string' then hero->>'portrait' else '/john-violaris-portrait.webp' end;
    if portrait='/Profile 7.png' then portrait:='/john-violaris-portrait.webp'; end if;
    -- URLs are currently immutable. Still compare each side independently so
    -- the date boundary remains correct if a future controlled owner migration
    -- moves metadata: removal at old URL, insertion at new URL.
    for image_url in select distinct unnest(array[before_row->>'url',after_row->>'url']) loop
      if image_url is null then continue; end if;
      old_asset:=case when before_row->>'url'=image_url then before_row end;
      new_asset:=case when after_row->>'url'=image_url then after_row end;
      if portrait=image_url and private.sitemap_image_value(old_asset,hero,true) is distinct from private.sitemap_image_value(new_asset,hero,true) then paths:=paths||array['/']; end if;
      for peer in select b.* from public.blog_posts b where b.content->>'featuredImage'=image_url and private.sitemap_article_live(b) loop
        if private.sitemap_image_value(old_asset,peer.content,false) is distinct from private.sitemap_image_value(new_asset,peer.content,false) then paths:=paths||array['/blog/'||peer.slug]; end if;
      end loop;
    end loop;
  elsif tg_table_name='services' then
    old_live:=coalesce((before_row->>'published')::boolean,false); new_live:=coalesce((after_row->>'published')::boolean,false);
    before_image:=private.sitemap_service_global(before_row); after_image:=private.sitemap_service_global(after_row);
    if before_image is distinct from after_image then paths:=array(select private.sitemap_public_paths()); end if;
    if private.sitemap_service_featured(before_row) is distinct from private.sitemap_service_featured(after_row) then paths:=paths||array['/']; end if;
    if private.sitemap_service_card_intro(before_row) is distinct from private.sitemap_service_card_intro(after_row) then
      paths:=paths||array['/','/services'];
    end if;
    if private.sitemap_service_page_intro(before_row) is distinct from private.sitemap_service_page_intro(after_row)
      and new_live and after_row->'content'->>'href' is null and not exists(select 1 from public.service_pages p where p.service_id=(after_row->>'id')::uuid and p.published and p.content->>'intro' is not null) then
      paths:=paths||array['/services/'||(after_row->>'slug')];
    end if;
  elsif tg_table_name='blog_posts' then
    changed_id:=coalesce((after_row->>'id')::uuid,(before_row->>'id')::uuid);
    if private.sitemap_article_cards(changed_id,before_row) is distinct from private.sitemap_article_cards(changed_id,after_row) then
      paths:=paths||array['/blog'];
      for peer in select b.id,b.slug from public.blog_posts b where b.id<>changed_id and private.sitemap_article_live(b) loop
        before_links:=private.sitemap_article_links(peer.id,changed_id,before_row); after_links:=private.sitemap_article_links(peer.id,changed_id,after_row);
        if before_links is not null and after_links is not null and before_links is distinct from after_links then paths:=paths||array['/blog/'||peer.slug]; end if;
      end loop;
    end if;
  else
    old_live:=coalesce(private.sitemap_location_live(jsonb_populate_record(null::public.location_pages,before_row)),false);
    new_live:=coalesce(private.sitemap_location_live(jsonb_populate_record(null::public.location_pages,after_row)),false);
    before_image:=case when old_live then jsonb_build_array(before_row->'slug',before_row->'title',before_row->'location') end;
    after_image:=case when new_live then jsonb_build_array(after_row->'slug',after_row->'title',after_row->'location') end;
    if before_image is distinct from after_image then
      changed_id:=coalesce((after_row->>'id')::uuid,(before_row->>'id')::uuid);
      for peer in select l.id,l.slug,l.content from public.location_pages l where l.id<>changed_id and private.sitemap_location_live(l)
        and case when jsonb_typeof(l.content->'relatedLocations')='array' then
          jsonb_array_length(l.content->'relatedLocations')<=20 and not exists(select 1 from jsonb_array_elements(l.content->'relatedLocations') v where jsonb_typeof(v)<>'string' or (v#>>'{}') !~ '^/locations/[a-z0-9]+(-[a-z0-9]+)*$') else false end loop
        before_links:=private.sitemap_location_links(peer.id,peer.content->'relatedLocations',changed_id,before_row);
        after_links:=private.sitemap_location_links(peer.id,peer.content->'relatedLocations',changed_id,after_row);
        if before_links is not null and after_links is not null and before_links is distinct from after_links then paths:=paths||array['/locations/'||peer.slug]; end if;
      end loop;
    end if;
  end if;
  insert into private.sitemap_change_dates(path,modified_at) select path,clock_timestamp() from (select distinct unnest(paths) as path) affected
  where private.is_public_sitemap_path(path)
  on conflict(path) do update set modified_at=greatest(private.sitemap_change_dates.modified_at,excluded.modified_at);
  if tg_op='DELETE' then return old; end if; return new;
end;
$$;
revoke all on function private.capture_sitemap_dependency_date() from public,anon,authenticated,service_role;
create trigger site_settings_capture_sitemap_dependency after insert or update or delete on public.site_settings for each row execute function private.capture_sitemap_dependency_date();
create trigger media_assets_capture_sitemap_dependency after insert or update or delete on public.media_assets for each row execute function private.capture_sitemap_dependency_date();
create trigger services_capture_sitemap_dependency after insert or update or delete on public.services for each row execute function private.capture_sitemap_dependency_date();
create trigger blog_posts_capture_sitemap_dependency after insert or update or delete on public.blog_posts for each row execute function private.capture_sitemap_dependency_date();
create trigger location_pages_capture_sitemap_dependency after insert or update or delete on public.location_pages for each row execute function private.capture_sitemap_dependency_date();

-- Provably used current sources preserve their original valid timestamps. No
-- historical settings/media reference reconstruction or migration-time date.
insert into private.sitemap_change_dates(path,modified_at)
select path,max(modified_at) from (
  select p.path,s.updated_at as modified_at from public.site_settings s cross join lateral private.sitemap_public_paths() p(path)
    where private.sitemap_setting_is_used(s.key,s.value) and (s.key<>'initials' or p.path='/')
  union all select p.path,s.updated_at from public.services s cross join lateral private.sitemap_public_paths() p(path) where s.published
  union all select '/blog',b.updated_at from public.blog_posts b where private.sitemap_article_live(b)
  union all select '/blog/'||b.slug,m.updated_at from public.media_assets m join public.blog_posts b on b.content->>'featuredImage'=m.url where private.sitemap_article_live(b)
  union all select '/',m.updated_at from public.media_assets m where m.url=(
    select case when portrait='/Profile 7.png' then '/john-violaris-portrait.webp' else portrait end from (
      select coalesce((select case when jsonb_typeof(content->'portrait')='string' then content->>'portrait' end from public.page_sections where page='home' and section='hero'),'/john-violaris-portrait.webp') as portrait
    ) current_portrait)
) evidence where modified_at is not null and isfinite(modified_at) and modified_at<=clock_timestamp()
group by path on conflict(path) do update set modified_at=greatest(private.sitemap_change_dates.modified_at,excluded.modified_at);

-- The invoker wrapper is a schema capability signal and exposes the same two
-- columns through the existing reviewed projection. It cannot read private
-- sources or widen the definer's live/public scope.
create function public.get_sitemap_dependency_dates()
returns table(path text,modified_at timestamptz) language sql stable security invoker set search_path='' as $$
  select d.path,d.modified_at from public.get_sitemap_change_dates() d;
$$;
revoke all on function public.get_sitemap_dependency_dates() from public,anon,authenticated,service_role;
grant execute on function public.get_sitemap_dependency_dates() to anon,authenticated;
