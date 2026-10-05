begin;
select plan(11);

insert into auth.users(id,email) values
  ('00000000-0000-4000-8000-000000008871','seo-rls@example.test');
update public.profiles set role='seo_editor'
where id='00000000-0000-4000-8000-000000008871';
insert into public.blog_posts(slug,title,published) values
  ('role-live-fixture','Original wording',true),
  ('role-draft-fixture','Private draft',false);
insert into public.seo_metadata(path,content) values
  ('/blog/role-live-fixture','{}'),('/blog/role-draft-fixture','{"title":"Draft SEO"}');

set local role anon;
select is((select count(*)::int from public.seo_metadata where path like '/blog/role-%-fixture'),1,
  'anonymous API excludes draft metadata');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000008871',true);
select is((select count(*)::int from public.seo_metadata where path like '/blog/role-%-fixture'),2,
  'SEO editor can read draft metadata');
select is((select count(*)::int from public.blog_posts where slug='role-draft-fixture'),0,
  'SEO editor cannot read private article bodies');
select is((select count(*)::int from public.enquiries),0,
  'SEO editor cannot read enquiries');
select is((with changed as (update public.blog_posts set title='Blocked' where slug='role-live-fixture'
  returning id) select count(*)::int from changed),0,'SEO editor cannot update public body copy');
select throws_ok($$insert into public.blog_posts(slug,title) values('role-blocked','Blocked')$$,
  '42501',null,'SEO editor cannot create articles');
select throws_ok($$update public.profiles set role='admin' where id=auth.uid()$$,
  '42501',null,'SEO editor cannot promote its own role');
select lives_ok($$update public.seo_metadata set content='{"title":"SEO edit"}'
  where path='/blog/role-draft-fixture'$$,'SEO editor can save metadata');
select lives_ok($$insert into public.site_settings(key,value) values('robots','{}')
  on conflict(key) do update set value=excluded.value$$,'SEO editor can save crawl rules');
select throws_ok($$update public.site_settings set key='role-injected' where key='robots'$$,
  '42501',null,'SEO editor cannot rename allowed setting to unrelated key');
reset role;
select is((select title from public.blog_posts where slug='role-live-fixture'),'Original wording',
  'original body wording survives denied update');
select * from finish();
rollback;
