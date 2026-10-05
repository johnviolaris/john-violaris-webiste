/** Actual PostgreSQL allow/deny checks; isolated fixtures, no hosted connection. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

if (!process.argv[2]) throw new Error("Pass the temporary PGlite installation directory.");
const { PGlite } = await import(pathToFileURL(resolve(process.argv[2], "node_modules/@electric-sql/pglite/dist/index.js")).href);
const db = new PGlite();
let checks = 0;
const scalar = async (sql) => Object.values((await db.query(sql)).rows[0])[0];
async function equal(sql, expected, label) {
  assert.equal(await scalar(sql), expected, label); checks++;
}
async function denied(sql, label) {
  await assert.rejects(db.query(sql), (error) => error.code === "42501", label); checks++;
}
async function migration(name) {
  await db.exec(await readFile(new URL(`../supabase/migrations/${name}`, import.meta.url), "utf8"));
}
try {
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; grant usage on schema auth to anon,authenticated;
    create table auth.users(id uuid primary key, email text, raw_app_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as
      $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
  `);
  for (const name of ["20260913183223_create_profiles.sql", "20260914103000_create_cms_content_tables.sql",
    "20260922120000_create_page_sections.sql", "20260914210000_create_enquiries.sql",
    "20260927215019_redirects_and_enquiry_attribution.sql", "20261005130124_content_revisions_and_blog_scheduling.sql",
    "20261005131215_location_pages_architecture.sql", "20261005154542_seo_editor_permissions.sql"]) await migration(name);
  await db.exec(`
    insert into auth.users(id,email) values
      ('00000000-0000-4000-8000-000000008801','seo@example.test'),
      ('00000000-0000-4000-8000-000000008802','user@example.test'),
      ('00000000-0000-4000-8000-000000008803','admin@example.test');
    update public.profiles set role='seo_editor' where id='00000000-0000-4000-8000-000000008801';
    update public.profiles set role='admin' where id='00000000-0000-4000-8000-000000008803';
    insert into public.blog_posts(slug,title,published,published_at,unpublish_at) values
      ('live','Original article',true,now()-interval '1 hour',null),
      ('draft','Private draft',false,null,null),
      ('future','Future article',true,now()+interval '1 hour',null),
      ('expired','Expired article',true,now()-interval '2 hours',now()-interval '1 hour');
    insert into public.site_settings(key,value) values('name','"Original business"'),('robots','{}'),('scripts','{"ga4":true,"reviews":true}');
    insert into public.seo_metadata(path,content) values
      ('/','{"title":"Home"}'),('/blog/live','{}'),('/blog/draft','{"title":"Private SEO draft"}'),
      ('/blog/future','{}'),('/blog/expired','{}'),('/admin','{"title":"Never public"}');
    insert into public.enquiries(first_name,last_name,phone,email,matter_type,description)
      values('Fixture','Only','07700900123','fixture@example.test','Drink Driving','Disposable private enquiry fixture');
    set role anon;
  `);
  await equal("select count(*)::int from public.seo_metadata", 2, "anon sees metadata only for home and currently live article");
  await denied("select * from public.enquiries", "anon cannot read private enquiries");
  await denied("insert into public.seo_metadata(path) values('/contact')", "anon cannot edit SEO");
  await db.exec("reset role; set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000008801',false)");
  await equal("select count(*)::int from public.seo_metadata", 6, "SEO role can read draft metadata without draft body access");
  await equal("select count(*)::int from public.blog_posts", 1, "SEO role sees only public article bodies");
  await equal("select count(*)::int from public.enquiries", 0, "SEO role sees no enquiries");
  await equal("with changed as (update public.blog_posts set title='Blocked' where slug='live' returning id) select count(*)::int from changed", 0, "SEO role cannot change article wording");
  await denied("insert into public.blog_posts(slug,title) values('blocked','Blocked')", "SEO role cannot create content");
  await denied("update public.profiles set role='admin' where id=auth.uid()", "SEO role cannot promote itself");
  await db.exec("update public.seo_metadata set content='{\"title\":\"SEO revision\"}' where path='/blog/draft'");
  await equal("select content->>'title' from public.seo_metadata where path='/blog/draft'", "SEO revision", "SEO role can edit private draft metadata");
  await db.exec("update public.site_settings set value='{\"rules\":[]}' where key='robots'");
  await equal("select value->>'rules' from public.site_settings where key='robots'", "[]", "SEO role can edit robots settings");
  await equal("with changed as (update public.site_settings set value='\"Blocked\"' where key='name' returning key) select count(*)::int from changed", 0, "SEO role cannot change business settings");
  await equal("with changed as (update public.site_settings set value='{}' where key='scripts' returning key) select count(*)::int from changed", 0, "SEO role cannot change integration settings");
  await denied("update public.site_settings set key='injected' where key='robots'", "SEO role cannot rename allowed robots row into another setting");
  await db.exec("select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000008802',false)");
  await equal("select count(*)::int from public.seo_metadata", 2, "ordinary authenticated user sees only public metadata");
  await denied("insert into public.seo_metadata(path) values('/contact')", "ordinary user cannot manage SEO");
  await db.exec("select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000008803',false)");
  await equal("select count(*)::int from public.enquiries", 1, "administrator retains private enquiry access");
  await db.exec("update public.site_settings set value='\"Admin edit\"' where key='name'");
  await equal("select value#>>'{}' from public.site_settings where key='name'", "Admin edit", "administrator retains settings capability");
  await equal("with changed as (update public.site_settings set value='{}' where key='scripts' returning key) select count(*)::int from changed", 1, "administrator can change integration settings");
  await equal("select title from public.blog_posts where slug='live'", "Original article", "denied body edit preserved original content");
  console.log(JSON.stringify({ sqlChecks: checks, hostedWrites: 0, engine: "isolated PostgreSQL via PGlite" }));
} finally { await db.close(); }
