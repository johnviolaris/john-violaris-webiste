begin;
select plan(51);

select has_table('public','page_section_drafts','private static draft storage exists');
select ok((select relrowsecurity from pg_class where oid='public.page_section_drafts'::regclass),'static draft RLS enabled');
select ok(not has_table_privilege('anon','public.page_section_drafts','select'),'anon cannot enumerate static drafts');
select ok(not (select prosecdef from pg_proc where oid='public.save_page_section_content(text,text,jsonb,text,jsonb,uuid,bigint)'::regprocedure),'workflow runs as invoker');
select ok(not has_function_privilege('anon','public.save_page_section_content(text,text,jsonb,text,jsonb,uuid,bigint)','execute'),'anon has no workflow execute grant');

insert into auth.users(id,email) values
('00000000-0000-4000-8000-000000006601','static-admin@example.test'),
('00000000-0000-4000-8000-000000006602','static-user@example.test'),
('00000000-0000-4000-8000-000000006603','static-seo@example.test');
update public.profiles set role='admin' where id='00000000-0000-4000-8000-000000006601';
update public.profiles set role='seo_editor' where id='00000000-0000-4000-8000-000000006603';
-- These unique fixture keys never replace seeded or existing page wording.
insert into public.page_sections(page,section,content) values
('static-draft-fixture','intro','{"eyebrow":"Original fixture"}'),
('static-unrelated-fixture','intro','{"eyebrow":"Unchanged fixture"}');
create temporary table draft_tokens(label text primary key,id uuid,version bigint);
grant all on draft_tokens to authenticated;

select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000006601',true);
set local role authenticated;
select lives_ok($$select public.save_page_section_content('static-draft-fixture','intro','{"eyebrow":"Private fixture"}','draft','{"eyebrow":"Original fixture"}',null,null)$$,'admin saves private draft');
insert into draft_tokens select 'first',id,version from public.page_section_drafts where page='static-draft-fixture';
select is((select content->>'eyebrow' from public.page_sections where page='static-draft-fixture'),'Original fixture','saving draft preserves live copy');
select is((select base_content from public.page_section_drafts where page='static-draft-fixture'),'{"eyebrow":"Original fixture"}'::jsonb,'draft captures original live baseline');
select is((select version from public.page_section_drafts where page='static-draft-fixture'),1::bigint,'first draft version is one');
select is((select actor_id::text from public.content_revisions where entity_table='page_section_drafts' and entity_key='static-draft-fixture/intro' order by revision_number desc limit 1),'00000000-0000-4000-8000-000000006601','private history records editor identity');

reset role;
set local role anon;
select throws_ok($$select * from public.page_section_drafts$$,'42501',null,'anon cannot read draft table');
select throws_ok($$select public.save_page_section_content('static-draft-fixture','intro','{}','publish',null,null,null)$$,'42501',null,'anon cannot publish');
select is((select content->>'eyebrow' from public.page_sections where page='static-draft-fixture'),'Original fixture','public still sees original');

reset role;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000006602',true);
set local role authenticated;
select is((select count(*)::integer from public.page_section_drafts where page='static-draft-fixture'),0,'ordinary user cannot read draft');
with changed as(update public.page_section_drafts set content='{}' where page='static-draft-fixture' returning id) select is((select count(*)::integer from changed),0,'ordinary user cannot update draft');
select throws_ok($$insert into public.page_section_drafts(page,section,content) values('static-user-fixture','intro','{}')$$,'42501',null,'ordinary user cannot create draft');
select throws_ok($$select public.save_page_section_content('static-draft-fixture','intro','{}','publish',null,null,null)$$,'42501',null,'ordinary user cannot use workflow');
select is((select count(*)::integer from public.content_revisions where entity_table='page_section_drafts' and entity_key='static-draft-fixture/intro'),0,'ordinary user cannot read private snapshots');

reset role;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000006603',true);
set local role authenticated;
select is((select count(*)::integer from public.page_section_drafts where page='static-draft-fixture'),0,'SEO editor cannot read body drafts');
select throws_ok($$select public.save_page_section_content('static-draft-fixture','intro','{}','publish',null,null,null)$$,'42501',null,'SEO editor cannot publish body drafts');
select is((select count(*)::integer from public.content_revisions where entity_table='page_section_drafts' and entity_key='static-draft-fixture/intro'),0,'SEO editor cannot read body snapshots');

reset role;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000006601',true);
set local role authenticated;
select throws_ok($$select public.save_page_section_content('static-draft-fixture','intro','{}','draft','{"eyebrow":"Original fixture"}',null,null)$$,'P0001',null,'stale empty token cannot replace a draft');
select lives_ok($$select public.save_page_section_content('static-draft-fixture','intro','{"eyebrow":"Revised fixture"}','draft','{"eyebrow":"Original fixture"}',(select id from draft_tokens where label='first'),1)$$,'recorded draft token can update');
insert into draft_tokens select 'second',id,version from public.page_section_drafts where page='static-draft-fixture';
select is((select version from public.page_section_drafts where page='static-draft-fixture'),2::bigint,'each save advances version');
select is((select base_content from public.page_section_drafts where page='static-draft-fixture'),'{"eyebrow":"Original fixture"}'::jsonb,'update retains original baseline');
select is((select count(*)::integer from public.content_revisions where entity_table='page_section_drafts' and entity_key='static-draft-fixture/intro'),2,'each private save creates snapshot');
select throws_ok($$select public.save_page_section_content('static-draft-fixture','intro','{}','publish','{"eyebrow":"Original fixture"}',(select id from draft_tokens where label='first'),1)$$,'P0001',null,'old version cannot publish');

update public.page_sections set content='{"eyebrow":"New live fixture"}' where page='static-draft-fixture';
select throws_ok($$select public.save_page_section_content('static-draft-fixture','intro','{}','publish','{"eyebrow":"Original fixture"}',(select id from draft_tokens where label='second'),2)$$,'P0001',null,'changed live baseline blocks publication');
select throws_ok($$select public.save_page_section_content('static-draft-fixture','intro','{}','draft','{"eyebrow":"New live fixture"}',(select id from draft_tokens where label='second'),2)$$,'P0001',null,'fresh live token cannot silently rebase older draft');
select lives_ok($$select public.save_page_section_content('static-draft-fixture','intro','{}','discard','{"eyebrow":"Original fixture"}',(select id from draft_tokens where label='second'),2)$$,'discard is allowed despite changed live baseline');
select is((select content->>'eyebrow' from public.page_sections where page='static-draft-fixture'),'New live fixture','discard preserves newer live copy');
select is((select count(*)::integer from public.page_section_drafts where page='static-draft-fixture'),0,'discard removes current draft');
select is((select snapshot->'content'->>'eyebrow' from public.content_revisions where entity_table='page_section_drafts' and entity_key='static-draft-fixture/intro' and operation='create' order by revision_number limit 1),'Private fixture','history remains after draft deletion');

select public.save_page_section_content('static-draft-fixture','intro','{"eyebrow":"Published fixture"}','draft','{"eyebrow":"New live fixture"}',null,null);
insert into draft_tokens select 'recreated',id,version from public.page_section_drafts where page='static-draft-fixture';
select isnt((select id::text from draft_tokens where label='recreated'),(select id::text from draft_tokens where label='first'),'recreated draft has fresh UUID');
select is((select version from draft_tokens where label='recreated'),1::bigint,'recreated draft deliberately repeats numeric version');
select throws_ok($$select public.save_page_section_content('static-draft-fixture','intro','{}','publish','{"eyebrow":"New live fixture"}',(select id from draft_tokens where label='first'),1)$$,'P0001',null,'old UUID cannot overwrite recreated same-version draft');
select lives_ok($$select public.save_page_section_content('static-draft-fixture','intro','{"eyebrow":"Published fixture"}','publish','{"eyebrow":"New live fixture"}',(select id from draft_tokens where label='recreated'),1)$$,'explicit publish succeeds with current token');
select is((select count(*)::integer from public.page_section_drafts where page='static-draft-fixture'),0,'successful publish removes private draft');
select is((select content->>'eyebrow' from public.page_sections where page='static-draft-fixture'),'Published fixture','explicit publication changes live copy');
select is((select content->>'eyebrow' from public.page_sections where page='static-unrelated-fixture'),'Unchanged fixture','unrelated public section preserved');
select throws_ok($$delete from public.content_revisions where entity_key='static-draft-fixture/intro'$$,'42501',null,'admin cannot erase history');
reset role;
set local role anon;
select is((select content->>'eyebrow' from public.page_sections where page='static-draft-fixture'),'Published fixture','public sees content only after publication');

reset role;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000006601',true);
set local role authenticated;
select public.save_page_section_content('static-empty-fixture','intro','{"eyebrow":"New fixture"}','draft',null,null,null);
insert into draft_tokens select 'empty',id,version from public.page_section_drafts where page='static-empty-fixture';
select is((select base_content from public.page_section_drafts where page='static-empty-fixture'),null::jsonb,'source-default section records a null live baseline');
select is((select count(*)::integer from public.page_sections where page='static-empty-fixture'),0,'saving new draft does not fabricate a live row');
select throws_ok($$select public.save_page_section_content('static-empty-fixture','intro','{}','publish','{}',(select id from draft_tokens where label='empty'),1)$$,'P0001',null,'an empty object cannot replace the recorded null baseline');
select lives_ok($$select public.save_page_section_content('static-empty-fixture','intro','{"eyebrow":"New fixture"}','publish',null,(select id from draft_tokens where label='empty'),1)$$,'explicit publish can create an initially absent live section');
select public.save_page_section_content('static-empty-fixture','intro','{"eyebrow":"Private reset fixture"}','draft','{"eyebrow":"New fixture"}',null,null);
insert into draft_tokens select 'reset',id,version from public.page_section_drafts where page='static-empty-fixture';
select lives_ok($$select public.save_page_section_content('static-empty-fixture','intro','{}','reset','{"eyebrow":"New fixture"}',(select id from draft_tokens where label='reset'),1)$$,'explicit original-wording reset succeeds with current token');
select is((select count(*)::integer from public.page_sections where page='static-empty-fixture'),0,'reset removes live override so source defaults render');
select is((select count(*)::integer from public.page_section_drafts where page='static-empty-fixture'),0,'reset removes saved draft atomically');
select is((select count(*)::integer from public.content_revisions where entity_table='page_sections' and entity_key='static-empty-fixture/intro' and operation='delete'),1,'reset retains previous live values in history');
select throws_ok($$select public.save_page_section_content('static-empty-fixture','intro','{}','reset','{"eyebrow":"New fixture"}',null,null)$$,'P0001',null,'stale original-wording reset is rejected');
reset role;
select * from finish();
rollback;
