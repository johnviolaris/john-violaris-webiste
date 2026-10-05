begin;
select plan(8);
insert into auth.users(id,email,raw_app_meta_data) values
  ('00000000-0000-4000-8000-000000008601','caption-admin@example.test','{}'),
  ('00000000-0000-4000-8000-000000008602','caption-seo@example.test','{}');
update public.profiles set role='admin' where id='00000000-0000-4000-8000-000000008601';
update public.profiles set role='seo_editor' where id='00000000-0000-4000-8000-000000008602';
insert into public.media_assets(id,url,filename,mime_type,width,height,alt_text,caption) values
  ('00000000-0000-4000-8000-000000008603','/caption-fixture.png','caption-fixture.png','image/png',12,9,'Test photograph','**Legacy literal caption**');
select is((select caption_format from public.media_assets where id='00000000-0000-4000-8000-000000008603'),'plain','omitted formats preserve literal legacy captions');
select is((select caption from public.media_assets where id='00000000-0000-4000-8000-000000008603'),'**Legacy literal caption**','stored caption words are unchanged');
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000008601',true);
set local role authenticated;
select throws_ok($$update public.media_assets set caption_format='html' where id='00000000-0000-4000-8000-000000008603'$$,'23514',null,'arbitrary HTML caption formats are rejected');
update public.media_assets set caption='**Credit** [source](https://example.com)',caption_format='markdown' where id='00000000-0000-4000-8000-000000008603';
select is((select caption_format from public.media_assets where id='00000000-0000-4000-8000-000000008603'),'markdown','admin explicitly opts in to conservative formatting');
select is((select snapshot->>'caption_format' from public.content_revisions where entity_table='media_assets' and entity_id='00000000-0000-4000-8000-000000008603' order by revision_number desc limit 1),'markdown','history preserves the format with the caption');
reset role;
set local role anon;
select is((select count(*)::int from public.media_assets where id='00000000-0000-4000-8000-000000008603'),0,'formatted draft captions are not exposed anonymously');
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000008602',true);
set local role authenticated;
select is((with changed as(update public.media_assets set caption_format='plain' returning id) select count(*)::int from changed),0,'SEO-only editors cannot alter caption formats');
select is((select count(*)::int from public.content_revisions where entity_table='media_assets' and entity_id='00000000-0000-4000-8000-000000008603'),0,'SEO-only editors cannot inspect draft image history');
reset role;
select * from finish();
rollback;
