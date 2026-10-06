begin;
select plan(40);

select ok((select relrowsecurity from pg_class where oid='private.sitemap_change_dates'::regclass),'watermark has defense-in-depth RLS');
select ok(not has_table_privilege('anon','private.sitemap_change_dates','select'),'anon has no watermark table read grant');
select ok(not has_table_privilege('authenticated','private.sitemap_change_dates','insert,update,delete'),'authenticated cannot fabricate dates');
select ok(not has_function_privilege('anon','private.capture_sitemap_change_date()','execute'),'anon cannot call date writer');
select ok(has_function_privilege('anon','public.get_sitemap_change_dates()','execute'),'anon can read the narrow date RPC');
select ok((select proconfig=array['search_path=""'] from pg_proc where oid='public.get_sitemap_change_dates()'::regprocedure),'RPC has pinned empty search path');
select ok((select pronargs=0 from pg_proc where oid='public.get_sitemap_change_dates()'::regprocedure),'RPC takes no history lookup argument');
select ok(pg_get_function_result('public.get_sitemap_change_dates()'::regprocedure)='TABLE(path text, modified_at timestamp with time zone)','RPC exposes only path and timestamp');

insert into auth.users(id,email) values ('00000000-0000-4000-8000-000000007301','sitemap-admin@example.test');
update public.profiles set role='admin' where id='00000000-0000-4000-8000-000000007301';
insert into public.page_sections(page,section,content) values ('fees','body','{"body":["Synthetic sitemap date fixture"]}')
on conflict(page,section) do update set content=excluded.content;
create temporary table sitemap_saved_dates(label text primary key,modified_at timestamptz);
insert into sitemap_saved_dates select 'fees',modified_at from private.sitemap_change_dates where path='/fees';
select ok((select modified_at is not null from sitemap_saved_dates where label='fees'),'registered live section creates real date');
update public.page_sections set content=content where page='fees' and section='body';
select ok((select d.modified_at=s.modified_at from private.sitemap_change_dates d,sitemap_saved_dates s where d.path='/fees' and s.label='fees'),'equal-content save does not advance date');
update public.page_sections set updated_at=now() where page='fees' and section='body';
select ok((select d.modified_at=s.modified_at from private.sitemap_change_dates d,sitemap_saved_dates s where d.path='/fees' and s.label='fees'),'date-only edit does not advance date');
insert into public.page_section_drafts(page,section,content,base_content) values ('fees','body','{"body":["Never public draft"]}','{}')
on conflict(page,section) do update set content=excluded.content;
select ok((select d.modified_at=s.modified_at from private.sitemap_change_dates d,sitemap_saved_dates s where d.path='/fees' and s.label='fees'),'private draft never changes public date');
insert into public.page_sections(page,section,content) values ('sitemap-private-fixture','unknown','{}');
select ok(not exists(select 1 from private.sitemap_change_dates where path='/sitemap-private-fixture'),'unregistered section does not invent route');
delete from public.page_sections where page='fees' and section='body';
select ok(not exists(select 1 from public.page_sections where page='fees' and section='body'),'live row really removed');
select ok((select modified_at>=(select modified_at from sitemap_saved_dates where label='fees') from private.sitemap_change_dates where path='/fees'),'reset retains deletion date after row disappears');

insert into public.blog_posts(slug,title,published,published_at,unpublish_at) values
('sitemap-live-fixture','Live fixture',true,now()-interval '1 hour',null),
('sitemap-draft-fixture','Private fixture',false,null,null),
('sitemap-future-fixture','Scheduled fixture',true,now()+interval '1 day',null),
('sitemap-expired-fixture','Expired fixture',true,now()-interval '2 days',now()-interval '1 day');
insert into public.seo_metadata(path,content) values
('/blog/sitemap-live-fixture','{"title":"Live metadata fixture"}'),
('/blog/sitemap-draft-fixture','{"title":"Private metadata fixture"}'),
('/blog/sitemap-future-fixture','{"title":"Scheduled metadata fixture"}'),
('/blog/sitemap-expired-fixture','{"title":"Expired metadata fixture"}'),
('/admin/sitemap-secret-fixture','{"title":"Secret metadata fixture"}');
select ok(exists(select 1 from private.sitemap_change_dates where path='/blog/sitemap-live-fixture'),'live article metadata records date');
select ok(not exists(select 1 from private.sitemap_change_dates where path='/blog/sitemap-draft-fixture'),'draft article metadata excluded');
select ok(not exists(select 1 from private.sitemap_change_dates where path='/blog/sitemap-future-fixture'),'scheduled article metadata excluded');
select ok(not exists(select 1 from private.sitemap_change_dates where path='/blog/sitemap-expired-fixture'),'expired article metadata excluded');
select ok(not exists(select 1 from private.sitemap_change_dates where path='/admin/sitemap-secret-fixture'),'private unregistered metadata excluded');
insert into sitemap_saved_dates select 'article',modified_at from private.sitemap_change_dates where path='/blog/sitemap-live-fixture';
update public.seo_metadata set content=content where path='/blog/sitemap-live-fixture';
select ok((select d.modified_at=s.modified_at from private.sitemap_change_dates d,sitemap_saved_dates s where d.path='/blog/sitemap-live-fixture' and s.label='article'),'equal metadata upsert keeps real date');
update public.seo_metadata set updated_at=now() where path='/blog/sitemap-live-fixture';
select ok((select d.modified_at=s.modified_at from private.sitemap_change_dates d,sitemap_saved_dates s where d.path='/blog/sitemap-live-fixture' and s.label='article'),'date-only metadata update keeps real date');
delete from public.seo_metadata where path='/blog/sitemap-live-fixture';
select ok(exists(select 1 from public.get_sitemap_change_dates() where path='/blog/sitemap-live-fixture'),'public metadata reset survives deleted override');
update public.blog_posts set published=false where slug='sitemap-live-fixture';
select ok(not exists(select 1 from public.get_sitemap_change_dates() where path='/blog/sitemap-live-fixture'),'withdrawn parent hides retained route date');
update public.blog_posts set published=true,unpublish_at=now()-interval '1 second' where slug='sitemap-live-fixture';
select ok(not exists(select 1 from public.get_sitemap_change_dates() where path='/blog/sitemap-live-fixture'),'expiry hides retained route date');

insert into public.services(id,slug,name,published,content) values
('00000000-0000-4000-8000-000000007311','sitemap-parent-fixture','Parent fixture',true,'{}'),
('00000000-0000-4000-8000-000000007312','sitemap-private-parent','Private parent fixture',false,'{}'),
('00000000-0000-4000-8000-000000007313','sitemap-private-body','Private body fixture',true,'{}'),
('00000000-0000-4000-8000-000000007314','sitemap-custom-href','Custom href fixture',true,'{"href":"/police-station"}');
insert into public.service_pages(service_id,published) values
('00000000-0000-4000-8000-000000007311',true),('00000000-0000-4000-8000-000000007312',true),
('00000000-0000-4000-8000-000000007313',false),('00000000-0000-4000-8000-000000007314',true);
insert into public.seo_metadata(path,content) values
('/services/sitemap-parent-fixture','{}'),('/services/sitemap-private-parent','{}'),('/services/sitemap-private-body','{}'),('/services/sitemap-custom-href','{}');
select ok(exists(select 1 from public.get_sitemap_change_dates() where path='/services/sitemap-parent-fixture'),'live service metadata date available');
select ok(not exists(select 1 from private.sitemap_change_dates where path='/services/sitemap-private-parent'),'private service catalogue parent excluded');
select ok(exists(select 1 from public.get_sitemap_change_dates() where path='/services/sitemap-private-body'),'published catalogue fallback route remains public while private body SEO source is excluded');
select ok(not exists(select 1 from private.sitemap_change_dates where path='/services/sitemap-custom-href'),'custom catalogue href never invents service URL');
insert into public.location_pages(slug,location,title,published,reviewed_by,reviewed_at,published_at,content) values
('sitemap-location-fixture','Synthetic fixture','Synthetic fixture',true,'00000000-0000-4000-8000-000000007301',now(),now()-interval '1 hour',
jsonb_build_object('intro',repeat('Fixture ',10),'description',repeat('Fixture ',8),'localContext',jsonb_build_array(repeat('Fixture ',90)),'body',jsonb_build_array(repeat('Fixture ',300)))),
('sitemap-location-future','Synthetic future fixture','Synthetic future fixture',true,'00000000-0000-4000-8000-000000007301',now(),now()+interval '1 day',
jsonb_build_object('intro',repeat('Fixture ',10),'description',repeat('Fixture ',8),'localContext',jsonb_build_array(repeat('Fixture ',90)),'body',jsonb_build_array(repeat('Fixture ',300))));
insert into public.seo_metadata(path,content) values ('/locations/sitemap-location-fixture','{}'),('/locations/sitemap-location-future','{}');
select ok(exists(select 1 from public.get_sitemap_change_dates() where path='/locations/sitemap-location-fixture'),'reviewed live location metadata available');
select ok(not exists(select 1 from private.sitemap_change_dates where path='/locations/sitemap-location-future'),'reviewed scheduled location excluded');
update public.location_pages set published=false,reviewed_by=null,reviewed_at=null where slug='sitemap-location-fixture';
select ok(not exists(select 1 from public.get_sitemap_change_dates() where path='/locations/sitemap-location-fixture'),'unreviewed withdrawn location date hidden');

set local role anon;
select ok(exists(select 1 from public.get_sitemap_change_dates() where path='/fees'),'anonymous date RPC works without private schema access');
select ok(not exists(select 1 from public.get_sitemap_change_dates() where path like '/admin/%' or path like '%draft-fixture%' or path like '%future%'),'anonymous RPC never returns private paths');
reset role;
select ok(not has_table_privilege('anon','public.content_revisions','select'),'raw audit remains inaccessible');
select ok(not has_function_privilege('authenticated','private.sitemap_section_paths(text,text)','execute'),'internal mapping remains inaccessible');
insert into private.sitemap_change_dates(path,modified_at) values('/privacy',now()+interval '1 day')
on conflict(path) do update set modified_at=excluded.modified_at;
select ok(not exists(select 1 from public.get_sitemap_change_dates() where path='/privacy'),'future watermark is never public date evidence');
insert into private.sitemap_change_dates(path,modified_at) values('/admin/sitemap-secret-fixture',now());
select ok(not exists(select 1 from public.get_sitemap_change_dates() where path='/admin/sitemap-secret-fixture'),'even an internal unknown watermark cannot expose a private route');
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000007301',true);
set local role authenticated;
select ok(not exists(select 1 from public.get_sitemap_change_dates() where path like '/admin/%' or path like '%draft-fixture%' or path like '%future%'),'admin session cannot broaden public RPC visibility');
reset role;
select ok(not exists(select 1 from public.get_sitemap_change_dates() where modified_at>clock_timestamp()),'no future public dates emitted');
select * from finish();
rollback;
