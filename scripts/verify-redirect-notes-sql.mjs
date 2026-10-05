/** Actual isolated PostgreSQL checks; no hosted database connection or writes. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

if (!process.argv[2]) throw new Error("Pass the temporary PGlite installation directory.");
const { PGlite } = await import(pathToFileURL(resolve(process.argv[2], "node_modules/@electric-sql/pglite/dist/index.js")).href);
const db = new PGlite();
let checks = 0;
const scalar = async (sql) => Object.values((await db.query(sql)).rows[0])[0];
async function equal(sql, expected, label) { assert.equal(await scalar(sql), expected, label); checks++; }
async function denied(sql, code, label) { await assert.rejects(db.query(sql), (error) => error.code === code, label); checks++; }
async function migration(name) { await db.exec(await readFile(new URL(`../supabase/migrations/${name}`, import.meta.url), "utf8")); }
const call = (source, destination, notes) => `select public.save_redirect_with_admin_notes('${source}','${destination}',true,true,'${notes.replaceAll("'", "''")}')`;

try {
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; grant usage on schema auth to anon,authenticated;
    create table auth.users(id uuid primary key,email text,raw_app_meta_data jsonb);
    create function auth.uid() returns uuid language sql stable as
      $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
  `);
  for (const name of ["20260913183223_create_profiles.sql", "20260914103000_create_cms_content_tables.sql",
    "20260922120000_create_page_sections.sql", "20260914210000_create_enquiries.sql",
    "20260927215019_redirects_and_enquiry_attribution.sql", "20261005130124_content_revisions_and_blog_scheduling.sql",
    "20261005131215_location_pages_architecture.sql", "20261005154542_seo_editor_permissions.sql"]) await migration(name);
  await db.exec(`
    insert into auth.users(id,email) values
      ('00000000-0000-4000-8000-000000006801','notes-admin@example.test'),
      ('00000000-0000-4000-8000-000000006802','notes-seo@example.test'),
      ('00000000-0000-4000-8000-000000006803','notes-user@example.test');
    update public.profiles set role='admin' where id='00000000-0000-4000-8000-000000006801';
    update public.profiles set role='seo_editor' where id='00000000-0000-4000-8000-000000006802';
    insert into public.redirects(source_path,destination_path,source_kind,created_at) values
      ('/notes-generated','/notes-target','blog_slug','2026-10-01T12:00:00Z'),
      ('/notes-upstream','/notes-middle','manual',now());
  `);
  const existingRules = (await db.query("select * from public.redirects order by source_path")).rows;
  await migration("20261005192958_private_redirect_admin_notes.sql");
  assert.deepEqual((await db.query("select * from public.redirects order by source_path")).rows, existingRules, "migration preserves every existing public redirect field"); checks++;
  await equal("select count(*)::int from public.redirect_admin_notes", 0, "migration invents no internal note content");
  await db.exec("select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000006801',false); set role authenticated");
  await equal(call("/notes-entry", "/notes-target", "Private fixture note"), "/notes-entry", "admin atomically creates a redirect and its note");
  await equal("select notes from public.redirect_admin_notes where source_path='/notes-entry'", "Private fixture note", "admin can read a saved internal note");
  await equal(call("/notes-generated", "/notes-next", "Generated alias explanation"), "/notes-generated", "admin can annotate an automatic alias");
  await equal("select source_kind from public.redirects where source_path='/notes-generated'", "blog_slug", "editing a generated redirect preserves its origin");
  await equal("select created_at='2026-10-01T12:00:00Z'::timestamptz from public.redirects where source_path='/notes-generated'", true, "editing preserves the redirect creation timestamp");
  await denied(call("/notes-entry", "/notes-broken", "x".repeat(1001)), "23514", "oversized note fails the atomic transaction");
  await equal("select destination_path from public.redirects where source_path='/notes-entry'", "/notes-target", "failed note does not partly change the redirect");
  await equal("select notes from public.redirect_admin_notes where source_path='/notes-entry'", "Private fixture note", "failed note preserves the previous note");
  await denied(call("/notes-middle", "/notes-next", "x".repeat(1001)), "23514", "a new redirect with an invalid note also rolls back");
  await equal("select count(*)::int from public.redirects where source_path='/notes-middle'", 0, "failed creation leaves no redirect behind");
  await equal("select destination_path from public.redirects where source_path='/notes-upstream'", "/notes-middle", "note failure rolls back dependent chain flattening too");
  await denied(call("/notes-entry", "/notes-entry", "Changed"), "23514", "redirect loop validation still runs inside the transaction");
  await equal("select notes from public.redirect_admin_notes where source_path='/notes-entry'", "Private fixture note", "loop rejection leaves the private note unchanged");
  await denied("insert into public.redirect_admin_notes(source_path,notes) values('/notes-missing','Orphan')", "23503", "note cannot exist without its redirect parent");
  await denied("update public.redirect_admin_notes set notes=chr(7) where source_path='/notes-entry'", "23514", "database rejects hidden note control characters");
  await db.exec("set role anon");
  await equal("select destination_path from public.redirects where source_path='/notes-entry'", "/notes-target", "public routing facts remain readable");
  await denied("select notes from public.redirect_admin_notes", "42501", "anonymous callers cannot enumerate private notes");
  await denied(call("/notes-entry", "/notes-next", "Leak"), "42501", "anonymous callers cannot invoke the notes save function");
  assert.ok(!String(await scalar("select to_jsonb(r)::text from public.redirects r where source_path='/notes-entry'")).includes("Private fixture note"), "public redirect payload never contains private notes"); checks++;
  for (const [id, role] of [["00000000-0000-4000-8000-000000006802", "SEO editor"], ["00000000-0000-4000-8000-000000006803", "ordinary user"]]) {
    await db.exec(`reset role; select set_config('request.jwt.claim.sub','${id}',false); set role authenticated`);
    await equal("select count(*)::int from public.redirect_admin_notes", 0, `${role} cannot read admin notes`);
    await equal("with changed as(update public.redirect_admin_notes set notes='Blocked' returning source_path) select count(*)::int from changed", 0, `${role} cannot update notes`);
    await denied("insert into public.redirect_admin_notes(source_path,notes) values('/notes-upstream','Blocked')", "42501", `${role} cannot create notes`);
    await denied(call("/notes-entry", "/notes-next", "Blocked"), "42501", `${role} cannot mutate routing through the invoker function`);
  }
  await db.exec("reset role; select set_config('request.jwt.claim.sub','',false); set role authenticated");
  await denied(call("/notes-entry", "/notes-next", "No identity"), "42501", "authenticated role without an actual admin identity cannot save");
  await db.exec("reset role; set role service_role");
  await denied("select * from public.redirect_admin_notes", "42501", "service key has no notes table grant");
  await denied(call("/notes-entry", "/notes-next", "No admin"), "42501", "service key has no callable notes-save grant");
  await db.exec("reset role; select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000006801',false); set role authenticated");
  await equal(call("/notes-entry", "/notes-target", "   "), "/notes-entry", "admin clears a note through the same transaction");
  await equal("select count(*)::int from public.redirect_admin_notes where source_path='/notes-entry'", 0, "clearing removes the private note");
  await equal("select destination_path from public.redirects where source_path='/notes-entry'", "/notes-target", "clearing a note preserves the redirect");
  await db.exec("delete from public.redirects where source_path='/notes-generated'");
  await equal("select count(*)::int from public.redirect_admin_notes where source_path='/notes-generated'", 0, "deleting an alias cleans up its private note by FK cascade");
  console.log(JSON.stringify({ sqlChecks: checks, hostedWrites: 0, engine: "isolated PostgreSQL via PGlite" }));
} catch (error) {
  console.error(JSON.stringify({ code: error.code, message: error.message, query: error.query, checksCompleted: checks }));
  process.exitCode = 1;
} finally { await db.close(); }
