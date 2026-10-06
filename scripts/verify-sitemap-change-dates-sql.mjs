/** Actual offline Postgres in PGlite; no hosted contacts. pgTAP runs separately in CI. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { pageGroups } from "../lib/cms/sections/schema.ts";

if (!process.argv[2]) throw new Error("Pass the temporary directory containing pinned @electric-sql/pglite@0.5.8.");
const { PGlite } = await import(pathToFileURL(resolve(process.argv[2], "node_modules/@electric-sql/pglite/dist/index.js")).href);
const db = new PGlite();
let extraChecks = 0;
const scalar = async (sql) => Object.values((await db.query(sql)).rows[0])[0];
const equal = async (sql, value, label) => { assert.equal(await scalar(sql), value, label); extraChecks++; };
const migration = async (file) => db.exec(await readFile(new URL(`../supabase/migrations/${file}`, import.meta.url), "utf8"));
try {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; grant usage on schema auth to anon,authenticated;
    create table auth.users(id uuid primary key,email text,raw_app_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;`);
  for (const file of ["20260913183223_create_profiles.sql", "20260914103000_create_cms_content_tables.sql", "20260922120000_create_page_sections.sql", "20260914210000_create_enquiries.sql", "20260927215019_redirects_and_enquiry_attribution.sql", "20261005120000_create_service_groups.sql", "20261005130124_content_revisions_and_blog_scheduling.sql", "20261005131215_location_pages_architecture.sql", "20261005154542_seo_editor_permissions.sql", "20261005154543_media_library_and_extended_history.sql", "20261005164633_rich_image_captions.sql", "20261006091709_private_static_page_drafts.sql"]) await migration(file);
  await db.exec(`insert into public.page_sections(page,section,content,updated_at) values ('about','intro','{}','2020-01-01T00:00:00Z');
    insert into public.seo_metadata(path,content,updated_at) values ('/reviews','{}','2020-02-01T00:00:00Z');
    insert into public.content_revisions(entity_table,entity_key,operation,snapshot,created_at) values
    ('page_sections','fees/body','delete','{"page":"fees","section":"body","updated_at":"2020-03-01T00:00:00Z"}','2020-04-01T00:00:00Z'),
    ('seo_metadata','/contact','delete','{"path":"/contact","updated_at":"2020-03-01T00:00:00Z"}','2020-05-01T00:00:00Z'),
    ('seo_metadata','/blog/unverifiable','delete','{"path":"/blog/unverifiable"}','2020-06-01T00:00:00Z'),
    ('page_section_drafts','privacy/intro','delete','{"page":"privacy","section":"intro"}','2020-07-01T00:00:00Z');`);
  await migration("20261006151718_public_sitemap_change_dates.sql");
  await equal("select modified_at='2020-01-01T00:00:00Z'::timestamptz from private.sitemap_change_dates where path='/about'", true, "Current baseline retains old updated_at, not migration/capture time.");
  await equal("select modified_at='2020-02-01T00:00:00Z'::timestamptz from private.sitemap_change_dates where path='/reviews'", true, "Current SEO baseline uses row timestamp.");
  await equal("select modified_at='2020-04-01T00:00:00Z'::timestamptz from private.sitemap_change_dates where path='/fees'", true, "Historical registered section deletion uses actual event time.");
  await equal("select modified_at='2020-05-01T00:00:00Z'::timestamptz from private.sitemap_change_dates where path='/contact'", true, "Historical fixed-route SEO reset recovers event time.");
  await equal("select count(*)::int from private.sitemap_change_dates where path in ('/privacy','/blog/unverifiable')", 0, "Private drafts and unverifiable dynamic deletions are omitted.");
  const sql = await readFile(new URL("../supabase/migrations/20261006151718_public_sitemap_change_dates.sql", import.meta.url), "utf8");
  const beforeBackfill = (await db.query("select * from private.sitemap_change_dates order by path")).rows;
  await db.exec(sql.slice(sql.indexOf("insert into private.sitemap_change_dates(path,modified_at)", sql.indexOf("-- Current live baselines")), sql.indexOf("-- This is deliberately public date evidence")));
  assert.deepEqual((await db.query("select * from private.sitemap_change_dates order by path")).rows, beforeBackfill, "Repeating actual backfill cannot advance an unchanged date."); extraChecks++;
  for (const page of pageGroups) for (const section of page.sections) {
    const expected = section.appearsOn.includes("*") ? ["/","/about","/services","/police-station","/fees","/reviews","/cookies","/privacy"] : section.appearsOn;
    const result = await db.query("select private.sitemap_section_paths($1,$2) as paths", [page.key,section.key]);
    assert.deepEqual(result.rows[0].paths, expected, `Actual dependency registry parity: ${page.key}/${section.key}`); extraChecks++;
  }
  // CI also has the complementary dependency migration; it fixes the live
  // fallback-service route boundary while retaining stricter hidden SEO reads.
  await migration("20261006162445_public_sitemap_dependency_dates.sql");
  // Minimal assertion adapters execute the same SQL/role transitions as pgTAP.
  // Any null/false result raises; this does not stand in for pgTAP or Supabase.
  await db.exec(`create table private.sitemap_test_count(passed int not null,expected int); insert into private.sitemap_test_count values(0,null);
    create function public.plan(value int) returns text language plpgsql security definer set search_path='' as $$begin update private.sitemap_test_count set expected=value; return 'plan'; end$$;
    create function public.ok(value boolean,label text) returns text language plpgsql security definer set search_path='' as $$begin if value is not true then raise exception 'Assertion failed: %',label; end if; update private.sitemap_test_count set passed=passed+1; return label; end$$;
    create function public.finish() returns setof text language plpgsql security definer set search_path='' as $$begin if exists(select 1 from private.sitemap_test_count where passed<>expected) then raise exception 'Incorrect assertion count'; end if; return next 'done'; end$$;`);
  const cases = await readFile(new URL("../supabase/tests/public_sitemap_change_dates.test.sql", import.meta.url), "utf8");
  await db.exec(cases.replace(/\brollback;/, "commit;"));
  const passed = await scalar("select passed from private.sitemap_test_count");
  await db.exec("set role anon");
  await assert.rejects(db.query("select * from private.sitemap_change_dates"), (error) => error.code === "42501"); extraChecks++;
  await db.exec("reset role");
  await db.exec("set role authenticated");
  await assert.rejects(db.query("insert into private.sitemap_change_dates(path,modified_at) values('/fees',now())"), (error) => error.code === "42501"); extraChecks++;
  await db.exec("reset role");
  console.log(JSON.stringify({ checks: passed + extraChecks, actualPostgres: true, platformAuthSimulated: true, hostedWrites: 0, pgTapAcceptance: "CI still required" }));
} finally { await db.close(); }
