begin;
select plan(31);

select has_table('public', 'content_revisions', 'content revisions exist');
select ok((select relrowsecurity from pg_class where oid = 'public.content_revisions'::regclass), 'revision RLS is enabled');
select ok(not has_table_privilege('anon', 'public.content_revisions', 'select'), 'anonymous clients cannot read revisions');
select ok(has_table_privilege('authenticated', 'public.content_revisions', 'select'), 'authenticated role can reach RLS');
select ok(not has_table_privilege('authenticated', 'public.content_revisions', 'insert,update,delete'), 'even admins cannot forge or overwrite history');
select has_trigger('public', 'blog_posts', 'blog_posts_capture_content_revision', 'blog changes create revisions');
select has_trigger('public', 'service_pages', 'service_pages_capture_content_revision', 'service page changes create revisions');
select ok(not has_function_privilege('anon', 'private.capture_content_revision()', 'execute'), 'private audit function is not anonymously executable');

insert into auth.users (id, email) values
('00000000-0000-4000-8000-000000009901', 'publication-admin@example.test'),
('00000000-0000-4000-8000-000000009902', 'publication-user@example.test');
update public.profiles set role = 'admin' where id = '00000000-0000-4000-8000-000000009901';

insert into public.blog_posts (slug, title, published, published_at, unpublish_at) values
('publication-test-live', 'Live', true, now() - interval '1 hour', now() + interval '1 hour'),
('publication-test-future', 'Future', true, now() + interval '1 hour', null),
('publication-test-expired', 'Expired', true, now() - interval '2 hours', now()),
('publication-test-draft', 'Draft', false, null, null);
select is((select count(*)::integer from public.content_revisions where snapshot->>'slug' like 'publication-test-%'), 4, 'each new article has a revision');
update public.blog_posts set title = 'Revised live' where slug = 'publication-test-live';
select is((select count(*)::integer from public.content_revisions where snapshot->>'slug' = 'publication-test-live'), 2, 'content update adds a snapshot');
update public.blog_posts set title = title where slug = 'publication-test-live';
select is((select count(*)::integer from public.content_revisions where snapshot->>'slug' = 'publication-test-live'), 3, 'each saved update appends a snapshot, including unchanged content');
select throws_ok($$insert into public.blog_posts (slug,title,published_at,unpublish_at) values ('publication-test-bad','Bad',now(),now())$$, '23514', null, 'expiry must be after publication');

set local role anon;
select is((select count(*)::integer from public.blog_posts where slug like 'publication-test-%'), 1, 'anon sees only the current publication window');
select throws_ok('select * from public.content_revisions', '42501', null, 'anon cannot read historical drafts');
reset role;

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000009902', true);
set local role authenticated;
select is((select count(*)::integer from public.blog_posts where slug like 'publication-test-%'), 1, 'ordinary signed-in user also sees only live content');
select is((select count(*)::integer from public.content_revisions where snapshot->>'slug' like 'publication-test-%'), 0, 'ordinary user cannot read history');
select throws_ok($$insert into public.content_revisions (entity_table,entity_id,operation,snapshot) values ('blog_posts',gen_random_uuid(),'create','{}')$$, '42501', null, 'ordinary user cannot forge history');
reset role;

select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000009901', true);
set local role authenticated;
select is((select count(*)::integer from public.blog_posts where slug like 'publication-test-%'), 4, 'admin can preview draft, scheduled and expired articles');
select is((select count(*)::integer from public.content_revisions where snapshot->>'slug' like 'publication-test-%'), 6, 'admin can read every create and saved-update revision');
select throws_ok($$delete from public.content_revisions where snapshot->>'slug' like 'publication-test-%'$$, '42501', null, 'admin cannot erase audit history');
update public.blog_posts set title = 'Admin edit' where slug = 'publication-test-live';
select is((select actor_id from public.content_revisions where snapshot->>'title' = 'Admin edit' order by revision_number desc limit 1), '00000000-0000-4000-8000-000000009901'::uuid, 'audit snapshot records the administrator');
select is((select snapshot->>'title' from public.content_revisions where snapshot->>'slug' = 'publication-test-live' order by revision_number limit 1), 'Live', 'old snapshot is unchanged after editing');
reset role;

insert into public.blog_posts(slug,title,published,published_at,unpublish_at) values
  ('window-future','Future',true,now()+interval '1 hour',null),
  ('window-expired','Expired',true,now()-interval '2 hours',now()),
  ('window-live','Live',true,now()-interval '1 hour',null),
  ('window-becomes-future','Rescheduled',true,now()-interval '1 hour',null),
  ('window-becomes-expired','Expires',true,now()-interval '1 hour',null);
update public.blog_posts set slug='window-future-renamed' where slug='window-future';
update public.blog_posts set slug='window-expired-renamed' where slug='window-expired';
update public.blog_posts set slug='window-live-renamed' where slug='window-live';
update public.blog_posts set slug='window-becomes-future-renamed',published_at=now()+interval '1 hour' where slug='window-becomes-future';
update public.blog_posts set slug='window-becomes-expired-renamed',unpublish_at=now() where slug='window-becomes-expired';
select is((select count(*)::int from public.redirects where source_path='/blog/window-future'), 0, 'scheduled rename does not reveal a private slug');
select is((select count(*)::int from public.redirects where source_path='/blog/window-expired'), 0, 'expired rename does not create a redirect');
select is((select destination_path from public.redirects where source_path='/blog/window-live'), '/blog/window-live-renamed', 'live rename creates the correct public redirect');
select is((select count(*)::int from public.redirects where source_path='/blog/window-becomes-future'), 0, 'rescheduling during rename never targets a future article');
select is((select count(*)::int from public.redirects where source_path='/blog/window-becomes-expired'), 0, 'expiry during rename never targets withdrawn content');
set local role anon;
select is((select count(*)::int from public.redirects where source_path like '/blog/window-%'), 1, 'public redirect metadata contains only the live rename');
reset role;

insert into public.services(id,slug,name,published,content) values
  ('00000000-0000-4000-8000-000000009903','parent-visibility-service','Parent visibility service',true,'{}');
insert into public.service_pages(service_id,published,content) values
  ('00000000-0000-4000-8000-000000009903',true,'{"intro":"Visible only while the parent is public"}');
set local role anon;
select is((select count(*)::int from public.service_pages where service_id='00000000-0000-4000-8000-000000009903'), 1, 'public parent permits an anonymous direct body read');
reset role;
update public.services set published=false where id='00000000-0000-4000-8000-000000009903';
set local role anon;
select is((select count(*)::int from public.service_pages where service_id='00000000-0000-4000-8000-000000009903'), 0, 'withdrawing the parent prevents an anonymous direct body read');
reset role;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000009901', true);
set local role authenticated;
select is((select count(*)::int from public.service_pages where service_id='00000000-0000-4000-8000-000000009903'), 1, 'admin can still preview the withdrawn parent service body');
reset role;

select * from finish();
rollback;
