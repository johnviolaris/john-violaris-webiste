/** Actual offline PostgreSQL and real migration; no hosted connection or Auth acceptance. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { mediaPresentation } from "../lib/cms/media/schema.ts";
import { heroDefaults } from "../lib/content/pages.ts";
import { toService } from "../lib/cms/mappers.ts";
import { resolveSiteConfig, siteSettingsDefaults } from "../lib/site-config.ts";
if (!process.argv[2]) throw new Error("Pass the temporary pinned @electric-sql/pglite@0.5.8 directory.");
const { PGlite } = await import(pathToFileURL(resolve(process.argv[2], "node_modules/@electric-sql/pglite/dist/index.js")).href);
const db = new PGlite();
let extraChecks = 0;
const scalar = async (sql) => Object.values((await db.query(sql)).rows[0])[0];
const equal = async (sql, value, label) => { assert.equal(await scalar(sql), value, label); extraChecks++; };
const migration = async (file) => db.exec(await readFile(new URL(`../supabase/migrations/${file}`, import.meta.url), "utf8"));
const sourceTables = ["blog_posts", "content_revisions", "location_pages", "page_section_drafts", "page_sections", "profiles", "redirects", "seo_metadata", "service_pages", "services", "site_settings", "media_assets", "article_review_plans"];
const sourceSnapshot = async () => Object.fromEntries(await Promise.all(sourceTables.map(async (table) => [table, (await db.query(`select to_jsonb(t) as row from public.${table} t order by to_jsonb(t)::text`)).rows])));
try {
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; grant usage on schema auth to anon,authenticated;
    create table auth.users(id uuid primary key,email text,raw_app_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;`);
  for (const file of ["20260913183223_create_profiles.sql", "20260914103000_create_cms_content_tables.sql", "20260922120000_create_page_sections.sql", "20260914210000_create_enquiries.sql", "20260927215019_redirects_and_enquiry_attribution.sql", "20261005120000_create_service_groups.sql", "20261005130124_content_revisions_and_blog_scheduling.sql", "20261005131215_location_pages_architecture.sql", "20261005154542_seo_editor_permissions.sql", "20261005154543_media_library_and_extended_history.sql", "20261005164633_rich_image_captions.sql", "20261006091709_private_static_page_drafts.sql", "20261006151718_public_sitemap_change_dates.sql", "20261006151734_private_article_review_plans.sql"]) await migration(file);
  await db.exec(`insert into public.site_settings(key,value,updated_at) values('name','"Synthetic baseline"','2020-01-01T00:00:00Z');
    insert into public.services(id,slug,name,published,updated_at) values('00000000-0000-4000-8000-000000007581','dependency-baseline-service','Baseline fixture',true,'2020-02-01T00:00:00Z');
    insert into public.blog_posts(slug,title,published,published_at,updated_at,content) values('dependency-baseline-article','Baseline article',true,'2019-01-01T00:00:00Z','2020-03-01T00:00:00Z','{"featuredImage":"https://example.test/baseline.webp","featuredImageAlt":"Baseline fallback"}');
    insert into public.media_assets(url,filename,mime_type,width,height,alt_text,updated_at) values('https://example.test/baseline.webp','baseline.webp','image/webp',100,100,'Baseline library','2020-05-01T00:00:00Z');
    alter table public.media_assets disable trigger media_assets_touch_updated_at;
    update public.media_assets set updated_at='2020-04-01T00:00:00Z' where url='/john-violaris-portrait.webp';
    alter table public.media_assets enable trigger media_assets_touch_updated_at;`);
  const before = await sourceSnapshot();
  const sequence = await scalar("select last_value from public.content_revisions_revision_number_seq");
  const sql = await readFile(new URL("../supabase/migrations/20261006162445_public_sitemap_dependency_dates.sql", import.meta.url), "utf8");
  await db.exec(sql);
  assert.deepEqual(await sourceSnapshot(), before, "Additive migration preserves every source row, history row and private plan."); extraChecks++;
  await equal("select last_value from public.content_revisions_revision_number_seq", sequence, "Migration cannot consume content history sequence.");
  await equal("select modified_at='2020-04-01T00:00:00Z'::timestamptz from private.sitemap_change_dates where path='/'", true, "Home portrait baseline uses original stored timestamp.");
  await equal("select modified_at='2020-03-01T00:00:00Z'::timestamptz from private.sitemap_change_dates where path='/blog'", true, "Blog baseline retains article source timestamp.");
  await equal("select modified_at='2020-05-01T00:00:00Z'::timestamptz from private.sitemap_change_dates where path='/blog/dependency-baseline-article'", true, "Actual live image baseline survives suppressing its current row.");
  await equal("select modified_at='2020-02-01T00:00:00Z'::timestamptz from private.sitemap_change_dates where path='/privacy'", true, "Global catalogue baseline uses original timestamp, not migration time.");
  const datesBefore = (await db.query("select * from private.sitemap_change_dates order by path")).rows;
  const backfill = sql.slice(sql.indexOf("insert into private.sitemap_change_dates(path,modified_at)", sql.indexOf("-- Provably used current sources")), sql.indexOf("-- The invoker wrapper"));
  await db.exec(backfill);
  assert.deepEqual((await db.query("select * from private.sitemap_change_dates order by path")).rows, datesBefore, "Repeated baseline cannot move an existing date."); extraChecks++;
  // Simulate additional original legacy row metadata, including no-op/default
  // values. Forward capture must ignore them; current baseline must preserve
  // their historical row timestamps instead of erasing surviving old evidence.
  await db.exec(`insert into public.site_settings(key,value,updated_at) values('email','""','2020-06-01T00:00:00Z');`);
  assert.deepEqual((await db.query("select * from private.sitemap_change_dates order by path")).rows, datesBefore, "Forward empty-default insertion remains a no-op."); extraChecks++;
  const beforeLegacy = await sourceSnapshot();
  const beforeLegacySequence = await scalar("select last_value from public.content_revisions_revision_number_seq");
  await db.exec(backfill);
  await equal("select modified_at='2020-06-01T00:00:00Z'::timestamptz from private.sitemap_change_dates where path='/privacy'", true, "Empty fixed-key legacy timestamp survives dependency authority.");
  assert.deepEqual(await sourceSnapshot(), beforeLegacy, "Legacy evidence baseline changes no source/history rows."); extraChecks++;
  await equal("select last_value from public.content_revisions_revision_number_seq", beforeLegacySequence, "Legacy baseline consumes no history sequence.");
  const afterEmpty = (await db.query("select * from private.sitemap_change_dates order by path")).rows;
  await db.exec(`insert into public.site_settings(key,value,updated_at) values('role','"Criminal Defence Solicitor"','2020-07-01T00:00:00Z');`);
  assert.deepEqual((await db.query("select * from private.sitemap_change_dates order by path")).rows, afterEmpty, "Forward identical fixed-default insertion remains a no-op."); extraChecks++;
  await db.exec(backfill);
  await equal("select modified_at='2020-07-01T00:00:00Z'::timestamptz from private.sitemap_change_dates where path='/privacy'", true, "Default-equivalent fixed-key original metadata is preserved as inherited evidence.");
  const afterLegacy = (await db.query("select * from private.sitemap_change_dates order by path")).rows;
  await db.exec(backfill);
  assert.deepEqual((await db.query("select * from private.sitemap_change_dates order by path")).rows, afterLegacy, "Empty/default legacy baseline is idempotent and never uses migration time."); extraChecks++;
  const keys = ["name", "role", "initials", "jurisdiction", "email", "responseTime", "sraNumber", "qualifiedYear", "reviewSolicitorsUrl", "lawSocietyUrl", "linkedinUrl"];
  for (const key of keys) {
    const fallback = (await db.query("select private.sitemap_setting_default($1) as value", [key])).rows[0].value;
    assert.equal(fallback, siteSettingsDefaults[key], `SQL static fallback matches actual config: ${key}`); extraChecks++;
    for (const value of ["", "   ", "\t\n\u00a0\ufeff", null, {}, "  Synthetic value  ", "\t\nSynthetic value\u00a0\ufeff"]) {
      const result = (await db.query("select coalesce(private.sitemap_string($1::jsonb),private.sitemap_setting_default($2)) as value", [JSON.stringify(value), key])).rows[0].value;
      assert.equal(result, resolveSiteConfig({ [key]: value })[key], `SQL setting normalization matches actual resolver: ${key}/${JSON.stringify(value)}`); extraChecks++;
    }
  }
  for (const value of ["07700 900123", "+44 7700 900123", "00447700900123", "short", "  "]) {
    const result = (await db.query("select private.sitemap_whatsapp($1::jsonb) as value", [JSON.stringify(value)])).rows[0].value;
    assert.equal(result, resolveSiteConfig({ whatsappNumber: value }).whatsappDigits, "SQL link normalization matches actual public config."); extraChecks++;
  }
  for (const asset of [
    { alt_text: "Hidden", is_decorative: true, title: "", caption: "", caption_format: "markdown" },
    { alt_text: "Actual alt", is_decorative: false, title: "Image title", caption: "**Caption**", caption_format: "markdown" },
    { alt_text: "Actual alt", is_decorative: false, title: "", caption: "Plain caption" },
  ]) {
    const result = (await db.query("select private.sitemap_image_value($1::jsonb,'{}',true) as value", [JSON.stringify(asset)])).rows[0].value;
    const expected = mediaPresentation(asset);
    assert.deepEqual(result, [expected.alt, expected.title ?? "", expected.caption ?? "", expected.caption ? expected.captionFormat : null], "SQL uses actual rendered media presentation."); extraChecks++;
  }
  const hero = (await db.query("select private.sitemap_image_value(null,'{}',true) as value")).rows[0].value;
  assert.deepEqual(hero, [heroDefaults.portraitAlt, heroDefaults.portraitTitle ?? "", heroDefaults.portraitCaption ?? "", heroDefaults.portraitCaption ? heroDefaults.portraitCaptionFormat ?? "plain" : null], "Missing portrait metadata resolves to actual existing defaults."); extraChecks++;
  for (const content of [{ group: "Fixture", icon: "document" }, { group: "Fixture", icon: "document", href: "/police-station", featured: true, short: "Short", statute: "" }, { group: "Fixture", icon: "document", featured: false, short: "Hidden", statute: "Fixture reference" }, { group: "Fixture", icon: "document", featured: true, short: "Fixture name" }, { group: "Fixture", icon: "document", featured: true, short: "" }, { group: "Fixture", icon: "document", featured: true }]) {
    const row = { slug: "fixture-service", name: "Fixture name", published: true, content };
    const service = toService(row);
    const result = (await db.query("select private.sitemap_service_global($1::jsonb) as global,private.sitemap_service_featured($1::jsonb) as featured", [JSON.stringify(row)])).rows[0];
    assert.deepEqual(result.global, [service.name, service.href, content.group, service.icon, service.statute ?? null], "Global SQL projection matches actual mapper; home-only fields excluded."); extraChecks++;
    assert.deepEqual(result.featured, service.featured ? [service.href, service.short ?? service.name] : null, "Home SQL featured projection matches actual mapper."); extraChecks++;
  }
  await db.exec(`create table private.dependency_test_count(passed int not null,expected int); insert into private.dependency_test_count values(0,null);
    create function public.plan(value int) returns text language plpgsql security definer set search_path='' as $$begin update private.dependency_test_count set expected=value; return 'plan'; end$$;
    create function public.ok(value boolean,label text) returns text language plpgsql security definer set search_path='' as $$begin if value is not true then raise exception 'Assertion failed: %',label; end if; update private.dependency_test_count set passed=passed+1; return label; end$$;
    create function public.finish() returns setof text language plpgsql security definer set search_path='' as $$begin if exists(select 1 from private.dependency_test_count where passed<>expected) then raise exception 'Incorrect assertion count'; end if; return next 'done'; end$$;`);
  const cases = await readFile(new URL("../supabase/tests/public_sitemap_dependency_dates.test.sql", import.meta.url), "utf8");
  await db.exec(cases.replace(/\brollback;/, "commit;"));
  const passed = await scalar("select passed from private.dependency_test_count");
  await db.exec("set role anon");
  await assert.rejects(db.query("select * from private.sitemap_change_dates"), (error) => error.code === "42501"); extraChecks++;
  await db.exec("reset role; set role authenticated");
  await assert.rejects(db.query("select private.capture_sitemap_dependency_date()"), (error) => error.code === "42501"); extraChecks++;
  await db.exec("reset role");
  console.log(JSON.stringify({ checks: passed + extraChecks, pgTapAssertions: passed, actualPostgres: true, platformAuthSimulated: true, hostedWrites: 0, pgTapAcceptance: "Separate CI pgTAP gate required" }));
} catch (error) { console.error(JSON.stringify({ checksCompleted: extraChecks, code: error.code, message: error.message, query: error.query })); process.exitCode = 1; }
finally { await db.close(); }
