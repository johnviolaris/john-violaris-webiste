/**
 * Offline SQL verification when Docker is unavailable. Uses actual Postgres in
 * PGlite and minimal Supabase Auth helpers; never contacts a hosted database.
 * Install @electric-sql/pglite@0.5.8 in a temporary directory, then run:
 * node scripts/verify-cms-workflows-sql.mjs <temporary-directory>
 * Full hosted-platform verification still uses `supabase test db` locally.
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

if (!process.argv[2]) throw new Error("Pass a temporary directory containing @electric-sql/pglite@0.5.8.");
const { PGlite } = await import(pathToFileURL(resolve(process.argv[2], "node_modules/@electric-sql/pglite/dist/index.js")).href);
const db = new PGlite();
let checks = 0;
const scalar = async (sql) => Object.values((await db.query(sql)).rows[0])[0];
const equal = async (sql, expected, label) => {
  assert.equal(await scalar(sql), expected, label); checks += 1;
};
const denied = async (sql, code, label) => {
  await assert.rejects(db.query(sql), (error) => error.code === code, label); checks += 1;
};
const migration = async (filename) => db.exec(await readFile(new URL(`../supabase/migrations/${filename}`, import.meta.url), "utf8"));

try {
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
    create schema auth;
    grant usage on schema auth to anon,authenticated;
    create table auth.users (id uuid primary key, email text, raw_app_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as
      $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
  `);
  await migration("20260913183223_create_profiles.sql");
  await migration("20260914103000_create_cms_content_tables.sql");
  await migration("20260922120000_create_page_sections.sql");
  await migration("20260914210000_create_enquiries.sql");
  await migration("20260927215019_redirects_and_enquiry_attribution.sql");
  await db.exec(`
    insert into auth.users (id,email) values
      ('00000000-0000-4000-8000-000000009901','admin@example.test'),
      ('00000000-0000-4000-8000-000000009902','user@example.test');
    update public.profiles set role='admin' where id='00000000-0000-4000-8000-000000009901';
    insert into public.blog_posts (slug,title,published,published_at) values
      ('test-live','Live',true,now()-interval '1 hour'),
      ('test-future','Future',true,now()+interval '1 hour'),
      ('test-expired','Expired',true,now()-interval '2 hours'),
      ('test-draft','Draft',false,null);
    insert into public.services (id,slug,name,published,content) values
      ('00000000-0000-4000-8000-000000009903','special-reasons','Special Reasons',true,'{}');
    insert into public.service_pages (service_id,published,content) values
      ('00000000-0000-4000-8000-000000009903',true,
       '{"emphasis":"Guilty of the offence, but not the ban.","intro":"Custom solicitor prose","penalties":[{"label":"No ban if accepted","note":"Disqualification avoided entirely","tone":"gold"},{"label":"Custom label","note":"Custom note"}]}');
    insert into public.page_sections (page,section,content) values
      ('home','hero','{"portrait":"/Profile 7.png","headline":"Preserve this headline"}');
  `);
  await migration("20261005130124_content_revisions_and_blog_scheduling.sql");
  await equal("select count(*)::int from public.content_revisions", 5, "baseline captures existing content");
  await db.exec("update public.blog_posts set unpublish_at=now() where slug='test-expired'");
  await equal("select count(*)::int from public.content_revisions", 6, "update appends history");
  await db.exec("update public.blog_posts set title=title where slug='test-live'");
  await equal("select count(*)::int from public.content_revisions", 6, "no-op does not append history");
  await denied("insert into public.blog_posts(slug,title,published_at,unpublish_at) values('bad','Bad',now(),now())", "23514", "inverted publication window is rejected");
  await db.exec("set role anon");
  await equal("select count(*)::int from public.blog_posts", 1, "anon sees only current publication window");
  await denied("select * from public.content_revisions", "42501", "anon cannot read draft history");
  await db.exec("reset role; select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000009902',false); set role authenticated");
  await equal("select count(*)::int from public.blog_posts", 1, "ordinary user sees only live articles");
  await equal("select count(*)::int from public.content_revisions", 0, "ordinary user cannot read revisions");
  await denied("insert into public.content_revisions(entity_table,entity_id,operation,snapshot) values('blog_posts',gen_random_uuid(),'create','{}')", "42501", "ordinary user cannot forge history");
  await db.exec("reset role; select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000009901',false); set role authenticated");
  await equal("select count(*)::int from public.blog_posts", 4, "admin can preview all article states");
  await equal("select count(*)::int from public.content_revisions", 6, "admin can read history");
  await denied("delete from public.content_revisions", "42501", "admin cannot erase history");
  await denied("insert into public.content_revisions(entity_table,entity_id,operation,snapshot) values('blog_posts',gen_random_uuid(),'create','{}')", "42501", "admin cannot forge history");
  await db.exec("update public.blog_posts set title='Admin revision' where slug='test-live'");
  await equal("select actor_id::text from public.content_revisions where snapshot->>'title'='Admin revision'", "00000000-0000-4000-8000-000000009901", "revision records actor identity");
  await equal("select snapshot->>'title' from public.content_revisions where snapshot->>'slug'='test-live' order by revision_number limit 1", "Live", "earlier snapshot remains unchanged");
  await db.exec("delete from public.blog_posts where slug='test-draft'");
  await equal("select operation from public.content_revisions where snapshot->>'slug'='test-draft' order by revision_number desc limit 1", "delete", "deletion is preserved in audit history");
  await db.exec("reset role; select set_config('request.jwt.claim.sub','',false)");
  const serviceContentBeforePortrait = await scalar("select content from public.service_pages");
  await migration("20261005131025_optimize_portrait.sql");
  assert.deepEqual(await scalar("select content from public.service_pages"), serviceContentBeforePortrait, "portrait migration preserves all saved service wording"); checks += 1;
  await equal("select content->'penalties'->0->>'label' from public.service_pages", "No ban if accepted", "unreviewed service wording is unchanged");
  await equal("select content->'penalties'->1->>'label' from public.service_pages", "Custom label", "custom penalty copy is preserved");
  await equal("select content->>'intro' from public.service_pages", "Custom solicitor prose", "custom service prose is preserved");
  await equal("select content->>'portrait' from public.page_sections where page='home' and section='hero'", "/john-violaris-portrait.webp", "legacy portrait is migrated");
  await equal("select content->>'headline' from public.page_sections where page='home' and section='hero'", "Preserve this headline", "other hero content is preserved");
  const revisionCount = await scalar("select count(*)::int from public.content_revisions");
  await migration("20261005131025_optimize_portrait.sql");
  await equal("select count(*)::int from public.content_revisions", revisionCount, "portrait optimization is idempotent");
  await migration("20261005131215_location_pages_architecture.sql");
  await equal("select count(*)::int from public.location_pages", 0, "location architecture seeds no cities or offices");
  await db.exec("insert into public.location_pages(slug,location,title) values('location-test-draft','Test area','Draft title')");
  await denied("update public.location_pages set published=true where slug='location-test-draft'", "23514", "unreviewed empty location cannot publish");
  await db.exec(`insert into public.location_pages(slug,location,title,published,reviewed_by,reviewed_at,content)
    values('location-test-live','Test area','Reviewed title',true,'00000000-0000-4000-8000-000000009901',now(),
    jsonb_build_object('intro',repeat('Test introduction ',5),'description',repeat('Test description ',5),
      'localContext',jsonb_build_array(repeat('Local factual context ',30)),
      'body',jsonb_build_array(repeat('Detailed factual advice ',100))))`);
  await db.exec("set role anon");
  await equal("select count(*)::int from public.location_pages", 1, "anonymous readers see only reviewed published locations");
  await denied("insert into public.location_pages(slug,location,title) values('location-test-anon','Area','Title')", "42501", "anonymous clients cannot create location pages");
  await db.exec("reset role; select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000009902',false); set role authenticated");
  await equal("select count(*)::int from public.location_pages", 1, "ordinary user cannot see location drafts");
  await denied("insert into public.location_pages(slug,location,title) values('location-test-user','Area','Title')", "42501", "ordinary user cannot create locations");
  await equal("with changed as(update public.location_pages set title='Unauthorized' returning id) select count(*)::int from changed", 0, "ordinary user cannot update location content");
  await equal("with removed as(delete from public.location_pages returning id) select count(*)::int from removed", 0, "ordinary user cannot delete location content");
  await db.exec("reset role; select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000009901',false); set role authenticated");
  await equal("select count(*)::int from public.location_pages", 2, "admin can read location drafts and live content");
  await db.exec("update public.location_pages set title='Admin edit' where slug='location-test-draft'");
  await equal("select title from public.location_pages where slug='location-test-draft'", "Admin edit", "admin may edit a location draft");
  await denied("update public.location_pages set published=true,reviewed_by='00000000-0000-4000-8000-000000009901',reviewed_at=now() where slug='location-test-draft'", "23514", "review acknowledgement cannot bypass substantive content requirements");
  await db.exec("update public.location_pages set slug='location-test-renamed' where slug='location-test-live'");
  await equal("select destination_path from public.redirects where source_path='/locations/location-test-live'", "/locations/location-test-renamed", "published location rename creates a redirect");
  await equal("select source_kind from public.redirects where source_path='/locations/location-test-live'", "location_slug", "location redirect origin remains identifiable");
  await db.exec("delete from public.location_pages where slug='location-test-draft'");
  await equal("select count(*)::int from public.location_pages", 1, "admin can delete a location draft");
  await db.exec(`
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
  `);
  await equal("select count(*)::int from public.redirects where source_path='/blog/window-future'", 0, "renaming a scheduled article does not disclose its old slug");
  await equal("select count(*)::int from public.redirects where source_path='/blog/window-expired'", 0, "renaming an expired article does not create a dead redirect");
  await equal("select destination_path from public.redirects where source_path='/blog/window-live'", "/blog/window-live-renamed", "live-to-live article rename preserves its public URL");
  await equal("select count(*)::int from public.redirects where source_path='/blog/window-becomes-future'", 0, "rescheduling during rename does not point visitors at future content");
  await equal("select count(*)::int from public.redirects where source_path='/blog/window-becomes-expired'", 0, "expiring during rename does not publish a redirect");
  await db.exec("set role anon");
  await equal("select count(*)::int from public.redirects where source_path like '/blog/window-%'", 1, "anonymous redirect metadata contains only the live rename");
  await db.exec("reset role");
  await db.exec("set role anon");
  await equal("select count(*)::int from public.service_pages where service_id='00000000-0000-4000-8000-000000009903'", 1, "anonymous Data API can read the body of a published parent service");
  await db.exec("reset role; update public.services set published=false where id='00000000-0000-4000-8000-000000009903'; set role anon");
  await equal("select count(*)::int from public.service_pages where service_id='00000000-0000-4000-8000-000000009903'", 0, "anonymous direct body read is withheld when its parent service is withdrawn");
  await db.exec("reset role; select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000009901',false); set role authenticated");
  await equal("select count(*)::int from public.service_pages where service_id='00000000-0000-4000-8000-000000009903'", 1, "administrators can still preview a withdrawn service body");
  await db.exec("reset role; update public.services set published=true where id='00000000-0000-4000-8000-000000009903'");
  await db.exec("select set_config('request.jwt.claim.sub','',false)");
  await migration("20261005120000_create_service_groups.sql");
  await migration("20261005154542_seo_editor_permissions.sql");
  await db.exec(`
    insert into public.site_settings(key,value) values('name','"Saved name"'),('robots','{}');
    insert into public.seo_metadata(path,content) values('/','{"description":"Previous description"}'),('/blog/test-future','{"title":"Private future metadata"}');
    insert into public.blog_categories(slug,name) values('fixture-category','Fixture category');
    insert into public.testimonials(author,quote,published) values('Fixture only','Historical database row',false);
    insert into auth.users(id,email) values('00000000-0000-4000-8000-000000009910','seo@example.test');
    update public.profiles set role='seo_editor' where id='00000000-0000-4000-8000-000000009910';
  `);
  const serviceBeforeExtension = await scalar("select content from public.service_pages");
  await migration("20261005154543_media_library_and_extended_history.sql");
  assert.deepEqual(await scalar("select content from public.service_pages"), serviceBeforeExtension, "media/history migration does not change service wording"); checks++;
  await equal("select count(*)::int from public.content_revisions where entity_table='page_sections' and entity_key='home/hero' and operation='baseline'", 1, "static sections receive a stable-key baseline");
  await equal("select count(*)::int from public.content_revisions where entity_table='site_settings' and operation='baseline'", 2, "key/value settings are included in history");
  await equal("select count(distinct entity_table)::int from public.content_revisions where entity_table in ('services','blog_categories','testimonials')", 3, "remaining catalogue sources receive audit baselines");
  const beforeIdenticalSave = await scalar("select count(*)::int from public.content_revisions");
  await db.exec("update public.page_sections set content=content where page='home' and section='hero'");
  await equal("select count(*)::int from public.content_revisions", beforeIdenticalSave + 1, "every saved update appends a version, even if values match");
  await db.exec("delete from public.site_settings where key='name'; insert into public.site_settings(key,value) values('name','\"Recovered name\"')");
  await equal("select count(*)::int from public.content_revisions where entity_table='site_settings' and entity_key='name'", 3, "reset and re-create keep the same setting history");
  await db.exec("set role anon");
  await equal("select count(*)::int from public.media_assets", 1, "image descriptions are publicly readable without draft snapshots");
  await denied("select * from public.content_revisions", "42501", "anonymous clients cannot read extended history");
  await db.exec("reset role; select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000009910',false); set role authenticated");
  await equal("select count(*)::int from public.content_revisions where entity_table not in ('seo_metadata') and not(entity_table='site_settings' and entity_key='robots')", 0, "SEO editor cannot read body, config or image audit snapshots");
  await db.exec("update public.seo_metadata set content='{" + '"description":"SEO saved description"' + "}' where path='/'");
  await equal("select actor_id::text from public.content_revisions where snapshot->'content'->>'description'='SEO saved description'", "00000000-0000-4000-8000-000000009910", "permitted SEO save captures editor identity");
  await db.exec("update public.site_settings set value='{\"rules\":[]}' where key='robots'");
  await equal("select count(*)::int from public.content_revisions where entity_table='site_settings' and entity_key='robots'", 2, "SEO crawl-rule saves are versioned");
  await equal("with changed as(update public.media_assets set title='Unauthorized' returning id) select count(*)::int from changed", 0, "SEO role cannot change image descriptions");
  await equal("with changed as(update public.page_sections set content='{}' returning id) select count(*)::int from changed", 0, "SEO role cannot change static copy through the Data API");
  await denied("insert into public.media_assets(url,filename,mime_type,width,height,alt_text) values('/blocked.png','blocked.png','image/png',1,1,'Blocked')", "42501", "SEO editor cannot upload registry rows");
  await denied("delete from public.content_revisions", "42501", "SEO editor cannot erase its own audit trail");
  await db.exec("reset role; select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000009901',false); set role authenticated");
  await db.exec("insert into public.media_assets(url,filename,mime_type,width,height,alt_text,caption) values('/private-fixture.png','private-fixture.png','image/png',12,9,'Private fixture','Unpublished caption')");
  await db.exec("set role anon");
  await equal("select count(*)::int from public.media_assets where url='/private-fixture.png'", 0, "unreferenced image captions cannot leak unpublished content");
  await db.exec("reset role; set role authenticated; insert into public.blog_posts(slug,title,published,content) values('public-media-fixture','Fixture article',true,'{\"featuredImage\":\"/private-fixture.png\"}'); set role anon");
  await equal("select count(*)::int from public.media_assets where url='/private-fixture.png'", 1, "published articles expose their image descriptions");
  await db.exec("reset role; set role authenticated; update public.blog_posts set published_at=now()+interval '1 hour' where slug='public-media-fixture'; set role anon");
  await equal("select count(*)::int from public.media_assets where url='/private-fixture.png'", 0, "future article windows keep image captions private");
  await db.exec("reset role; set role authenticated; update public.blog_posts set published_at=now()-interval '2 hours',unpublish_at=now()-interval '1 hour' where slug='public-media-fixture'; set role anon");
  await equal("select count(*)::int from public.media_assets where url='/private-fixture.png'", 0, "expired article windows keep image captions private");
  await db.exec("reset role; set role authenticated; update public.blog_posts set unpublish_at=null where slug='public-media-fixture'; set role anon");
  await equal("select count(*)::int from public.media_assets where url='/private-fixture.png'", 1, "live article windows expose their image descriptions");
  await db.exec("reset role; set role authenticated; update public.blog_posts set published=false where slug='public-media-fixture'; set role anon");
  await equal("select count(*)::int from public.media_assets where url='/private-fixture.png'", 0, "withdrawing an article hides its central image caption");
  await db.exec("reset role; select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000009902',false); set role authenticated");
  await equal("select count(*)::int from public.media_assets where url='/private-fixture.png'", 0, "ordinary accounts cannot enumerate unpublished image metadata");
  await equal("with changed as(update public.media_assets set caption='Unauthorized' returning id) select count(*)::int from changed", 0, "ordinary accounts cannot mutate public or private image descriptions");
  await equal("select count(*)::int from public.content_revisions", 0, "ordinary accounts cannot read any extended audit history");
  await db.exec("reset role; select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000009901',false)");
  await db.exec("reset role; set role authenticated");
  await equal("select count(*)::int from public.media_assets where url='/private-fixture.png'", 1, "admin library reads retain unpublished image metadata");
  await denied("insert into public.media_assets(url,filename,mime_type,width,height) values('/empty.png','empty.png','image/png',1,1)", "23514", "non-decorative registry images require alt text at database level");
  await denied("update public.media_assets set url='/broken.webp'", "P0001", "existing served image URLs cannot be changed even by editor requests");
  await db.exec("update public.media_assets set title='Portrait title',caption='Portrait credit',is_decorative=true,alt_text='' where url='/john-violaris-portrait.webp'");
  await equal("select count(*)::int from public.content_revisions where entity_table='media_assets' and snapshot->>'url'='/john-violaris-portrait.webp'", 2, "image description updates append their own version");
  await db.exec("insert into public.service_groups(name) values('Audited fixture group'); update public.blog_categories set name='Updated category' where slug='fixture-category'");
  await equal("select count(*)::int from public.content_revisions where entity_table='service_groups'", 1, "service group saves are audited");
  await equal("select count(*)::int from public.content_revisions where entity_table='blog_categories'", 2, "category renames are audited");
  await db.exec("update public.location_pages set published_at=now()+interval '1 hour',slug='location-test-scheduled' where slug='location-test-renamed'");
  await equal("select count(*)::int from public.redirects where source_path='/locations/location-test-renamed'", 0, "a location rename that becomes scheduled creates no public redirect");
  await db.exec("set role anon");
  await equal("select count(*)::int from public.location_pages", 0, "future reviewed locations remain invisible through anonymous RLS");
  await db.exec("reset role; update public.location_pages set published_at=now()-interval '2 hours',unpublish_at=now()-interval '1 hour'; set role anon");
  await equal("select count(*)::int from public.location_pages", 0, "expired location windows disappear from anonymous reads");
  await db.exec("reset role; update public.location_pages set unpublish_at=null; set role anon");
  await equal("select count(*)::int from public.location_pages", 1, "currently reviewed locations become readable inside their window");
  await db.exec("reset role; select set_config('request.jwt.claim.sub','',false)");
  const captionsBefore = (await db.query("select url,caption from public.media_assets order by url")).rows;
  const serviceBeforeCaptions = await scalar("select content from public.service_pages");
  await migration("20261005164633_rich_image_captions.sql");
  assert.deepEqual((await db.query("select url,caption from public.media_assets order by url")).rows, captionsBefore, "rich caption migration preserves every existing caption verbatim"); checks++;
  assert.deepEqual(await scalar("select content from public.service_pages"), serviceBeforeCaptions, "rich captions do not change any service wording"); checks++;
  await equal("select bool_and(caption_format='plain') from public.media_assets", true, "all existing captions remain explicitly plain text");
  await db.exec("select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000009901',false); set role authenticated");
  await denied("update public.media_assets set caption_format='html'", "23514", "database rejects unsupported caption formats");
  await db.exec("update public.media_assets set caption='**Portrait credit** [source](https://example.com)',caption_format='markdown' where url='/john-violaris-portrait.webp'");
  await equal("select snapshot->>'caption_format' from public.content_revisions where entity_table='media_assets' and snapshot->>'url'='/john-violaris-portrait.webp' order by revision_number desc limit 1", "markdown", "formatted caption saves preserve their format in immutable history");
  await db.exec("set role anon");
  await equal("select caption_format from public.media_assets where url='/john-violaris-portrait.webp'", "markdown", "public images expose the format required for safe rendering");
  await equal("select count(*)::int from public.media_assets where url='/private-fixture.png'", 0, "caption format addition preserves draft image privacy");
  await db.exec("reset role; select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000009910',false); set role authenticated");
  await equal("with changed as(update public.media_assets set caption_format='plain' returning id) select count(*)::int from changed", 0, "SEO-only editors cannot alter rich caption formats");
  await db.exec("reset role; select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000009902',false); set role authenticated");
  await equal("with changed as(update public.media_assets set caption_format='plain' returning id) select count(*)::int from changed", 0, "ordinary authenticated accounts cannot alter rich caption formats");
  console.log(`Passed ${checks} isolated PostgreSQL publication, RLS, revision, location and content-migration checks.`);
} finally {
  await db.close();
}
