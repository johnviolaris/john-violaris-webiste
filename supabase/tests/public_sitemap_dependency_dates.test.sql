begin;
select plan(83);

select ok(not has_table_privilege('anon','private.sitemap_change_dates','select'),'anonymous cannot read private watermarks');
select ok(not has_table_privilege('authenticated','private.sitemap_change_dates','insert,update,delete'),'client cannot manufacture watermarks');
select ok(not has_function_privilege('anon','private.capture_sitemap_dependency_date()','execute'),'anonymous cannot call dependency capture');
select ok(not has_function_privilege('authenticated','private.sitemap_public_paths()','execute'),'private registry mapping is not an API');
select ok(has_function_privilege('anon','public.get_sitemap_dependency_dates()','execute'),'anonymous can call minimal capability wrapper');
select ok(has_function_privilege('authenticated','public.get_sitemap_dependency_dates()','execute'),'authenticated can call minimal capability wrapper');
select ok(not has_function_privilege('service_role','public.get_sitemap_dependency_dates()','execute'),'service key gains no wrapper grant');
select ok((select not prosecdef and pronargs=0 and proconfig=array['search_path=""'] from pg_proc where oid='public.get_sitemap_dependency_dates()'::regprocedure),'wrapper is zero-argument invoker with pinned search path');
select ok(pg_get_function_result('public.get_sitemap_dependency_dates()'::regprocedure)='TABLE(path text, modified_at timestamp with time zone)','wrapper payload has no values or identifiers');

insert into auth.users(id,email) values ('00000000-0000-4000-8000-000000007501','dependency-admin@example.test'),('00000000-0000-4000-8000-000000007502','dependency-seo@example.test');
update public.profiles set role='admin' where id='00000000-0000-4000-8000-000000007501';
update public.profiles set role='seo_editor' where id='00000000-0000-4000-8000-000000007502';
insert into public.services(id,slug,name,published,content) values
('00000000-0000-4000-8000-000000007511','dependency-fallback','Fallback fixture',true,'{}'),
('00000000-0000-4000-8000-000000007512','dependency-custom','Custom fixture',true,'{"href":"/police-station"}'),
('00000000-0000-4000-8000-000000007513','dependency-empty','Empty href fixture',true,'{"href":""}'),
('00000000-0000-4000-8000-000000007514','dependency-private','Private fixture',false,'{}'),
('00000000-0000-4000-8000-000000007515','Bad/Slug','Invalid route fixture',true,'{}');
insert into public.service_pages(service_id,published) values('00000000-0000-4000-8000-000000007511',false);
select ok(private.is_public_sitemap_path('/services/dependency-fallback'),'published catalogue with draft body is a real fallback route');
select ok(not private.is_public_sitemap_path('/services/dependency-custom'),'custom href does not create an offence route');
select ok(not private.is_public_sitemap_path('/services/dependency-empty'),'explicit empty href is not resolved as an offence route');
select ok(not private.is_public_sitemap_path('/services/dependency-private'),'unpublished catalogue is excluded');
select ok(not private.is_public_sitemap_path('/services/Bad/Slug'),'invalid nested slug cannot invent a route');

delete from public.site_settings where key='name';
delete from private.sitemap_change_dates;
insert into public.seo_metadata(path,content) values('/services/dependency-fallback','{"title":"Hidden fallback metadata fixture"}');
select ok(not exists(select 1 from private.sitemap_change_dates),'private draft-body SEO source cannot date public fallback service');
update public.seo_metadata set content='{"title":"Changed hidden metadata fixture"}' where path='/services/dependency-fallback';
select ok(not exists(select 1 from private.sitemap_change_dates),'hidden fallback service SEO update does not date public copy');
delete from public.seo_metadata where path='/services/dependency-fallback';
select ok(not exists(select 1 from private.sitemap_change_dates),'hidden fallback service SEO deletion does not date public copy');
insert into public.site_settings(key,value) values('name','"John Violaris"') on conflict(key) do update set value=excluded.value;
select ok(not exists(select 1 from private.sitemap_change_dates),'inserting fixed default does not manufacture a change');
update public.site_settings set value=to_jsonb(chr(9)||chr(10)||chr(160)||chr(65279)) where key='name';
select ok(not exists(select 1 from private.sitemap_change_dates),'JS-trim whitespace-only string still resolves to unchanged default');
update public.site_settings set value='"  Synthetic public name  "' where key='name';
select ok(exists(select 1 from private.sitemap_change_dates where path='/services/dependency-fallback'),'known shared setting dates live dynamic routes');
select ok(exists(select 1 from private.sitemap_change_dates where path='/privacy'),'known shared setting dates shared layout');
create temporary table dependency_saved(label text primary key, dates jsonb);
insert into dependency_saved values('settings',(select jsonb_agg(to_jsonb(d) order by path) from private.sitemap_change_dates d));
update public.site_settings set value='"Synthetic public name"' where key='name';
select ok((select dates=(select jsonb_agg(to_jsonb(d) order by path) from private.sitemap_change_dates d) from dependency_saved where label='settings'),'trim-equivalent setting does not advance dates');
update public.site_settings set value=to_jsonb(chr(9)||chr(10)||'Synthetic public name'||chr(160)||chr(65279)) where key='name';
select ok((select dates=(select jsonb_agg(to_jsonb(d) order by path) from private.sitemap_change_dates d) from dependency_saved where label='settings'),'newline/tab/NBSP/BOM-equivalent override cannot falsely date all pages');
update public.site_settings set updated_at=clock_timestamp() where key='name';
select ok((select dates=(select jsonb_agg(to_jsonb(d) order by path) from private.sitemap_change_dates d) from dependency_saved where label='settings'),'timestamp-only setting write does not advance dates');
delete from public.site_settings where key='name';
select ok((select modified_at>(select (entry->>'modified_at')::timestamptz from dependency_saved s,jsonb_array_elements(s.dates) entry where s.label='settings' and entry->>'path'='/privacy') from private.sitemap_change_dates where path='/privacy'),'deleting a changed fixed override retains actual reset date');
delete from private.sitemap_change_dates;
insert into public.site_settings(key,value) values('initials','"FX"') on conflict(key) do update set value=excluded.value;
select ok((select count(*)=1 and bool_and(path='/') from private.sitemap_change_dates),'initials affect home only');
delete from private.sitemap_change_dates;
insert into public.site_settings(key,value) values('roleLong','"Email-only fixture"'),('dependency-private-key','"Private fixture"'),('practiceLegalName','"Unconfirmed fixture"') on conflict(key) do update set value=excluded.value;
select ok(not exists(select 1 from private.sitemap_change_dates),'unknown email-only and unconfirmed keys are excluded');
insert into public.site_settings(key,value) values('phoneE164','"+447700900123"'),('whatsappNumber','"07700 900123"') on conflict(key) do update set value=excluded.value;
select ok(not exists(select 1 from private.sitemap_change_dates),'unknown env fallback is not assumed on first phone override');
update public.site_settings set value='"+44 7700 900123"' where key='whatsappNumber';
select ok(not exists(select 1 from private.sitemap_change_dates),'same normalized WhatsApp link does not advance dates');
update public.site_settings set value='"+447700900124"' where key='phoneE164';
select ok(exists(select 1 from private.sitemap_change_dates where path='/privacy'),'known old/new phone override replacement is captured');

insert into public.blog_posts(id,slug,title,published,published_at,created_at,content) values
('00000000-0000-4000-8000-000000007521','dependency-a','A fixture',true,now()-interval '1 hour',now()-interval '1 day','{"excerpt":"A","featuredImage":"https://example.test/dependency.webp","featuredImageAlt":"Fallback image"}'),
('00000000-0000-4000-8000-000000007522','dependency-b','B fixture',true,now()-interval '2 hours',now()-interval '2 days','{"excerpt":"B"}'),
('00000000-0000-4000-8000-000000007523','dependency-c','C fixture',true,now()-interval '3 hours',now()-interval '3 days','{"excerpt":"C"}'),
('00000000-0000-4000-8000-000000007524','dependency-d','D fixture',true,now()-interval '4 hours',now()-interval '4 days','{"excerpt":"D"}'),
('00000000-0000-4000-8000-000000007525','dependency-e','E fixture',true,now()-interval '5 hours',now()-interval '5 days','{"excerpt":"E"}'),
('00000000-0000-4000-8000-000000007526','dependency-future','Future fixture',true,now()+interval '1 day',now(),'{}'),
('00000000-0000-4000-8000-000000007527','dependency-draft','Draft fixture',false,null,now(),'{}'),
-- Seeded older posts can share both ordering timestamps. They must not make
-- an otherwise deterministic top-three selection ambiguous.
('00000000-0000-4000-8000-000000007528','dependency-older-one','Older fixture one',true,null,'2020-01-01T00:00:00Z','{}'),
('00000000-0000-4000-8000-000000007529','dependency-older-two','Older fixture two',true,null,'2020-01-01T00:00:00Z','{}');
insert into public.blog_posts(slug,title,published,published_at,unpublish_at,content) values('dependency-expired','Expired fixture',true,now()-interval '2 days',now()-interval '1 day','{"featuredImage":"https://example.test/expired.webp"}');
delete from private.sitemap_change_dates;
select ok(private.sitemap_article_links('00000000-0000-4000-8000-000000007525',null,null)='[["dependency-a","A fixture"],["dependency-b","B fixture"],["dependency-c","C fixture"]]'::jsonb,'older unselected timestamp ties preserve deterministic More guides output');
insert into public.blog_posts(id,slug,title,published,published_at,created_at,content)
select '00000000-0000-4000-8000-000000007530','dependency-selected-tie','Selected tie fixture',true,published_at,created_at,'{}' from public.blog_posts where slug='dependency-a';
select ok(private.sitemap_article_links('00000000-0000-4000-8000-000000007525',null,null) is null,'ties among selected links remain ambiguous');
delete from private.sitemap_change_dates;
update public.blog_posts set title='Changed tied fixture' where slug='dependency-a';
select ok(exists(select 1 from private.sitemap_change_dates where path='/blog'),'ambiguous peer selection does not suppress a real blog-card change');
select ok(not exists(select 1 from private.sitemap_change_dates where path='/blog/dependency-e'),'ambiguous selected ordering cannot manufacture a peer change date');
update public.blog_posts set title='A fixture' where slug='dependency-a';
delete from public.blog_posts where slug='dependency-selected-tie';
insert into public.blog_posts(id,slug,title,published,published_at,created_at,content)
select '00000000-0000-4000-8000-000000007530','dependency-cutoff-tie','Cutoff tie fixture',true,published_at,created_at,'{}' from public.blog_posts where slug='dependency-c';
select ok(private.sitemap_article_links('00000000-0000-4000-8000-000000007525',null,null) is null,'a tie crossing the third-link cutoff remains ambiguous');
delete from public.blog_posts where slug='dependency-cutoff-tie';

delete from private.sitemap_change_dates;
update public.blog_posts set title=title,updated_at=clock_timestamp() where slug='dependency-a';
select ok(not exists(select 1 from private.sitemap_change_dates),'article timestamp-only save does not change a collection');
update public.blog_posts set content=jsonb_set(content,'{body}','["Changed body only"]') where slug='dependency-a';
select ok(not exists(select 1 from private.sitemap_change_dates),'body-only article edit does not change cards or More guides');
update public.blog_posts set title='Future changed fixture' where slug='dependency-future';
update public.blog_posts set title='Draft changed fixture' where slug='dependency-draft';
select ok(not exists(select 1 from private.sitemap_change_dates),'never-live article edits do not change public collection dates');
update public.blog_posts set published=false where slug='dependency-a';
select ok(exists(select 1 from private.sitemap_change_dates where path='/blog'),'visible article withdrawal dates blog index');
select ok(exists(select 1 from private.sitemap_change_dates where path='/blog/dependency-e'),'withdrawal dates a changed live More guides selection');
select ok(not exists(select 1 from public.get_sitemap_dependency_dates() where path='/blog/dependency-a'),'withdrawn route is absent from public projection');
update public.blog_posts set published=true where slug='dependency-a';
delete from private.sitemap_change_dates;
delete from public.blog_posts where slug='dependency-e';
select ok(exists(select 1 from private.sitemap_change_dates where path='/blog'),'article deletion retains blog index change date');
select ok(not exists(select 1 from private.sitemap_change_dates where path='/blog/dependency-b'),'deleting a guide outside top three does not date unrelated peer');

update public.blog_posts set published=true where slug='dependency-a';
insert into public.media_assets(url,filename,mime_type,width,height,alt_text,is_decorative,caption) values('https://example.test/dependency.webp','dependency.webp','image/webp',100,100,'Hidden one',true,'');
delete from private.sitemap_change_dates;
update public.media_assets set alt_text='Hidden two',caption_format='markdown' where url='https://example.test/dependency.webp';
select ok(not exists(select 1 from private.sitemap_change_dates),'decorative-hidden alt and empty caption format do not date article');
update public.media_assets set title='Visible image title' where url='https://example.test/dependency.webp';
select ok(exists(select 1 from private.sitemap_change_dates where path='/blog/dependency-a'),'live article image title is a real dependency');
select ok(not exists(select 1 from private.sitemap_change_dates where path='/blog'),'blog cards do not render image metadata');
delete from private.sitemap_change_dates;
delete from public.media_assets where url='https://example.test/dependency.webp';
select ok(exists(select 1 from private.sitemap_change_dates where path='/blog/dependency-a'),'image metadata deletion restores fallback and retains date');
insert into public.media_assets(url,filename,mime_type,width,height,alt_text) values('https://example.test/expired.webp','expired.webp','image/webp',100,100,'Expired fixture'),('https://example.test/unused.webp','unused.webp','image/webp',100,100,'Unused fixture');
delete from private.sitemap_change_dates;
update public.media_assets set title='Never public metadata' where url in ('https://example.test/expired.webp','https://example.test/unused.webp');
select ok(not exists(select 1 from private.sitemap_change_dates),'unused and expired image references do not create dates');
insert into public.page_sections(page,section,content) values('home','hero','{"portrait":"/Profile 7.png"}') on conflict(page,section) do update set content=excluded.content;
delete from private.sitemap_change_dates;
update public.media_assets set caption='A visible portrait caption' where url='/john-violaris-portrait.webp';
select ok((select count(*)=1 and bool_and(path='/') from private.sitemap_change_dates),'legacy mapped home portrait caption dates home only');
insert into public.page_section_drafts(page,section,content,base_content) values('home','hero','{"portrait":"https://example.test/unused.webp"}','{}') on conflict(page,section) do update set content=excluded.content;
delete from private.sitemap_change_dates;
update public.media_assets set title='Private hero draft only' where url='https://example.test/unused.webp';
select ok(not exists(select 1 from private.sitemap_change_dates),'private hero draft reference never dates public home');
update public.blog_posts set content=jsonb_set(content,'{featuredImage}','"https://example.test/moved.webp"') where slug='dependency-d';
insert into public.media_assets(url,filename,mime_type,width,height,alt_text) values('https://example.test/movable.webp','movable.webp','image/webp',100,100,'Metadata moved fixture');
update public.blog_posts set content=jsonb_set(content,'{featuredImage}','"https://example.test/movable.webp"') where slug='dependency-a';
delete from private.sitemap_change_dates;
-- Production immutability stays enabled. Only this rollback-only owned fixture
-- bypasses it to exercise both capture sides against a future owner migration.
alter table public.media_assets disable trigger media_assets_keep_url_stable;
update public.media_assets set url='https://example.test/moved.webp' where url='https://example.test/movable.webp';
alter table public.media_assets enable trigger media_assets_keep_url_stable;
select ok(exists(select 1 from private.sitemap_change_dates where path='/blog/dependency-a'),'metadata reassignment records removal at old live URL');
select ok(exists(select 1 from private.sitemap_change_dates where path='/blog/dependency-d'),'metadata reassignment records insertion at new live URL');

delete from private.sitemap_change_dates;
update public.services set content=jsonb_set(content,'{short}','"Not featured fixture"') where slug='dependency-fallback';
select ok(not exists(select 1 from private.sitemap_change_dates),'unfeatured short label is not rendered');
update public.services set content=jsonb_set(content,'{featured}','true') where slug='dependency-fallback';
select ok((select count(*)=1 and bool_and(path='/') from private.sitemap_change_dates),'featured membership affects home only');
delete from private.sitemap_change_dates;
update public.services set content=jsonb_set(content,'{short}','"Changed home label"') where slug='dependency-fallback';
select ok((select count(*)=1 and bool_and(path='/') from private.sitemap_change_dates),'featured short label cannot date unrelated fixed pages');
update public.services set content=content-'short' where slug='dependency-fallback';
delete from private.sitemap_change_dates;
update public.services set content=jsonb_set(content,'{short}','""') where slug='dependency-fallback';
select ok(not exists(select 1 from private.sitemap_change_dates),'empty featured short and absent short both render service name');
delete from private.sitemap_change_dates;
update public.services set content=jsonb_set(content,'{intro}','"Changed card fixture"') where slug='dependency-fallback';
select ok(not exists(select 1 from private.sitemap_change_dates where path='/privacy'),'card intro cannot date unrelated fixed pages');
select ok(exists(select 1 from private.sitemap_change_dates where path='/services/dependency-fallback'),'catalogue intro dates its actual fallback offence route');
delete from private.sitemap_change_dates;
update public.services set content=jsonb_set(content,'{privateFutureField}','"Ignored fixture"') where slug='dependency-fallback';
select ok(not exists(select 1 from private.sitemap_change_dates),'non-rendered catalogue property is excluded');
update public.services set content=jsonb_set(content,'{intro}','"Personal advice and representation, with a clear explanation of your options at every stage."') where slug='dependency-fallback';
delete from private.sitemap_change_dates;
update public.services set content=content-'intro' where slug='dependency-fallback';
select ok(not exists(select 1 from private.sitemap_change_dates where path in ('/','/services','/privacy')),'default-equivalent card intro reset does not date cards or unrelated pages');
select ok(exists(select 1 from private.sitemap_change_dates where path='/services/dependency-fallback'),'different offence fallback intro reset still dates actual own output');
delete from private.sitemap_change_dates;
update public.services set slug='dependency-custom-renamed' where slug='dependency-custom';
select ok(not exists(select 1 from private.sitemap_change_dates),'raw slug rename under unchanged custom href does not date navigation');
update public.services set content=jsonb_set(content,'{statute}','""') where slug='dependency-fallback';
select ok(not exists(select 1 from private.sitemap_change_dates),'absent and empty optional statute render identically');
delete from private.sitemap_change_dates;
update public.services set published=false where slug='dependency-fallback';
select ok(exists(select 1 from private.sitemap_change_dates where path='/privacy'),'service withdrawal changes shared catalogue globally');
select ok(not exists(select 1 from public.get_sitemap_dependency_dates() where path='/services/dependency-fallback'),'withdrawn service URL is removed from minimal projection');
delete from private.sitemap_change_dates;
delete from public.services where slug='dependency-custom-renamed';
select ok(exists(select 1 from private.sitemap_change_dates where path='/privacy'),'deleting a published custom-href service changes shared navigation');
delete from private.sitemap_change_dates;
delete from public.services where slug='dependency-private';
select ok(not exists(select 1 from private.sitemap_change_dates),'never-public service deletion does not create dates');

insert into public.location_pages(id,slug,location,title,published,reviewed_by,reviewed_at,content) values
('00000000-0000-4000-8000-000000007541','dependency-area','Fixture area','Area fixture',true,'00000000-0000-4000-8000-000000007501',now(),jsonb_build_object('intro',repeat('Fixture ',10),'description',repeat('Fixture ',8),'localContext',jsonb_build_array(repeat('Fixture ',90)),'body',jsonb_build_array(repeat('Fixture ',300)))),
('00000000-0000-4000-8000-000000007542','dependency-related','Related fixture area','Related fixture',true,'00000000-0000-4000-8000-000000007501',now(),jsonb_build_object('intro',repeat('Fixture ',10),'description',repeat('Fixture ',8),'localContext',jsonb_build_array(repeat('Fixture ',90)),'body',jsonb_build_array(repeat('Fixture ',300)),'relatedLocations',jsonb_build_array('/locations/dependency-area'))),
('00000000-0000-4000-8000-000000007543','dependency-unrelated','Unrelated fixture area','Unrelated fixture',true,'00000000-0000-4000-8000-000000007501',now(),jsonb_build_object('intro',repeat('Fixture ',10),'description',repeat('Fixture ',8),'localContext',jsonb_build_array(repeat('Fixture ',90)),'body',jsonb_build_array(repeat('Fixture ',300))));
delete from private.sitemap_change_dates;
update public.location_pages set location='Renamed single related fixture' where slug='dependency-area';
select ok(not exists(select 1 from private.sitemap_change_dates),'location sort-name rename with unchanged single link output creates no date');
update public.location_pages set title='Changed visible related title' where slug='dependency-area';
select ok(exists(select 1 from private.sitemap_change_dates where path='/locations/dependency-related'),'changed selected related-link title dates its owner');
update public.location_pages set content=jsonb_set(content,'{relatedLocations}','["/locations/dependency-area","/locations/dependency-unrelated"]') where slug='dependency-related';
delete from private.sitemap_change_dates;
update public.location_pages set location='ZZZ renamed fixture area' where slug='dependency-area';
select ok(exists(select 1 from private.sitemap_change_dates where path='/locations/dependency-related'),'location sort rename dates a genuinely reordered multiple-link list');
delete from private.sitemap_change_dates;
update public.location_pages set location='Unrelated fixture area' where slug='dependency-area';
select ok(not exists(select 1 from private.sitemap_change_dates),'ambiguous location-order ties are omitted instead of guessed');
update public.location_pages set location='Distinct fixture area' where slug='dependency-area';
delete from private.sitemap_change_dates;
update public.location_pages set published=false where slug='dependency-area';
select ok(exists(select 1 from private.sitemap_change_dates where path='/locations/dependency-related'),'location withdrawal dates actual related-location link owner');
select ok(not exists(select 1 from private.sitemap_change_dates where path='/locations/dependency-unrelated'),'unrelated location receives no date');
select ok(not exists(select 1 from public.get_sitemap_dependency_dates() where path='/locations/dependency-area'),'withdrawn location URL is hidden');

insert into private.sitemap_change_dates(path,modified_at) values('/admin/dependency-secret',clock_timestamp()),('/blog/dependency-future',clock_timestamp()),('/blog/dependency-draft',clock_timestamp());
create temporary table dependency_public_projection as select * from public.get_sitemap_dependency_dates();
grant select on dependency_public_projection to anon,authenticated;
set local role anon;
select ok(not exists(select 1 from public.get_sitemap_dependency_dates() where path like '/admin/%' or path like '%future%' or path like '%draft%'),'anonymous wrapper cannot expose draft/private paths');
select ok((select jsonb_agg(to_jsonb(d) order by path) from public.get_sitemap_dependency_dates() d)=(select jsonb_agg(to_jsonb(d) order by path) from public.get_sitemap_change_dates() d),'new wrapper preserves the old minimal projection');
select ok((select jsonb_agg(to_jsonb(d) order by path) from public.get_sitemap_dependency_dates() d)=(select jsonb_agg(to_jsonb(d) order by path) from dependency_public_projection d),'anonymous receives exact same minimal owner projection');
reset role;
select set_config('request.jwt.claim.sub','',true);
set local role authenticated;
select ok((select jsonb_agg(to_jsonb(d) order by path) from public.get_sitemap_dependency_dates() d)=(select jsonb_agg(to_jsonb(d) order by path) from dependency_public_projection d),'authenticated without identity cannot broaden projection');
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000007502',true);
set local role authenticated;
select ok(not exists(select 1 from public.get_sitemap_dependency_dates() where path like '/admin/%' or path like '%future%' or path like '%draft%'),'SEO editor cannot widen public visibility');
select ok((select jsonb_agg(to_jsonb(d) order by path) from public.get_sitemap_dependency_dates() d)=(select jsonb_agg(to_jsonb(d) order by path) from dependency_public_projection d),'SEO editor receives same minimal projection');
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000007501',true);
set local role authenticated;
select ok(not exists(select 1 from public.get_sitemap_dependency_dates() where path like '/admin/%' or path like '%future%' or path like '%draft%'),'admin cannot widen public visibility');
select ok((select jsonb_agg(to_jsonb(d) order by path) from public.get_sitemap_dependency_dates() d)=(select jsonb_agg(to_jsonb(d) order by path) from dependency_public_projection d),'admin receives same minimal projection');
reset role;
select ok(not exists(select 1 from public.get_sitemap_dependency_dates() where modified_at>clock_timestamp()),'wrapper never emits future evidence');
select * from finish();
rollback;
