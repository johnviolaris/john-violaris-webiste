begin;
select plan(17);
select has_table('public', 'location_pages', 'location storage exists');
select ok((select relrowsecurity from pg_class where oid = 'public.location_pages'::regclass), 'location RLS is enabled');
select ok(not has_table_privilege('anon', 'public.location_pages', 'insert,update,delete'), 'anonymous clients cannot change locations');
select has_trigger('public', 'location_pages', 'location_pages_capture_slug_redirect', 'location renames capture a redirect');

insert into auth.users(id,email) values
('00000000-0000-4000-8000-000000009951','location-admin@example.test'),
('00000000-0000-4000-8000-000000009952','location-user@example.test');
update public.profiles set role='admin' where id='00000000-0000-4000-8000-000000009951';
insert into public.location_pages(slug,location,title) values ('location-test-draft','Test area','Draft title');
select throws_ok($$update public.location_pages set published=true where slug='location-test-draft'$$, '23514', null, 'unreviewed empty page cannot be published');
insert into public.location_pages(slug,location,title,published,reviewed_by,reviewed_at,content)
values ('location-test-live','Test area','Reviewed page',true,'00000000-0000-4000-8000-000000009951',now(),jsonb_build_object('intro',repeat('Test introduction ',5),'description',repeat('Test description ',5),'localContext',jsonb_build_array(repeat('Local factual context ',30)),'body',jsonb_build_array(repeat('Detailed factual advice ',100))));

set local role anon;
select is((select count(*)::integer from public.location_pages where slug like 'location-test-%'),1,'anon sees only a reviewed published location');
select throws_ok($$insert into public.location_pages(slug,location,title) values('location-test-anon','Area','Title')$$,'42501',null,'anon cannot create a location');
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000009952',true);
set local role authenticated;
select is((select count(*)::integer from public.location_pages where slug like 'location-test-%'),1,'ordinary user cannot read location drafts');
select throws_ok($$insert into public.location_pages(slug,location,title) values('location-test-user','Area','Title')$$,'42501',null,'ordinary user cannot create a location');
with changed as (update public.location_pages set title='Unauthorized' where slug='location-test-live' returning *) select is((select count(*)::integer from changed),0,'ordinary user cannot edit published locations');
with removed as (delete from public.location_pages where slug='location-test-live' returning *) select is((select count(*)::integer from removed),0,'ordinary user cannot delete published locations');
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000009951',true);
set local role authenticated;
select is((select count(*)::integer from public.location_pages where slug like 'location-test-%'),2,'admin sees private drafts and live pages');
select lives_ok($$update public.location_pages set title='Admin edit' where slug='location-test-draft'$$,'admin can edit a draft');
select throws_ok($$update public.location_pages set published=true,reviewed_by='00000000-0000-4000-8000-000000009951',reviewed_at=now() where slug='location-test-draft'$$,'23514',null,'review acknowledgement alone cannot publish thin content');
update public.location_pages set slug='location-test-renamed' where slug='location-test-live';
select is((select destination_path from public.redirects where source_path='/locations/location-test-live'),'/locations/location-test-renamed','published location rename captures the canonical destination');
select is((select source_kind from public.redirects where source_path='/locations/location-test-live'),'location_slug','location redirect retains its source kind');
select lives_ok($$delete from public.location_pages where slug='location-test-draft'$$,'admin can delete a draft');
reset role;
select * from finish();
rollback;
