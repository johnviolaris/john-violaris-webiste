/** Local module integration only: no database, HTTP server or real Auth session. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import tls from "node:tls";
import dns from "node:dns";
import dgram from "node:dgram";
import { registerHooks, syncBuiltinESMExports } from "node:module";
import { pathToFileURL } from "node:url";
import { PassThrough } from "node:stream";
import ts from "typescript";
import { renderToPipeableStream, renderToStaticMarkup } from "react-dom/server";

if (process.argv[2] !== "--fixture-only" || process.argv.length !== 3) throw new Error("Explicit fixture-only entry required.");
let blockedNetworkAttempts = 0;
function noNetwork() { blockedNetworkAttempts++; throw new Error("Network is forbidden in location module fixtures."); }
Object.defineProperty(globalThis, "fetch", { value: noNetwork, configurable: false, writable: false });
http.request = http.get = https.request = https.get = noNetwork;
net.connect = net.createConnection = tls.connect = noNetwork;
net.Socket.prototype.connect = net.Server.prototype.listen = noNetwork;
for (const name of ["lookup", "lookupService", "resolve", "resolve4", "resolve6", "resolveAny", "reverse"]) { dns[name] = noNetwork; dns.promises[name] = noNetwork; }
for (const name of ["resolve", "resolve4", "resolve6", "resolveAny", "reverse"]) { dns.Resolver.prototype[name] = noNetwork; dns.promises.Resolver.prototype[name] = noNetwork; }
dgram.createSocket = noNetwork;
syncBuiltinESMExports();
// Exercise the guards themselves before importing application modules.
for (const call of [() => fetch("https://never-request.fixture.test"), () => http.get("http://never-request.fixture.test"), () => https.get("https://never-request.fixture.test"), () => net.connect(1234), () => tls.connect(1234), () => new net.Socket().connect(1234), () => net.createServer().listen(1234), () => dns.lookup("never-request.fixture.test"), () => dns.promises.resolve("never-request.fixture.test"), () => new dns.Resolver().resolve("never-request.fixture.test"), () => dgram.createSocket("udp4")]) assert.throws(call, /Network is forbidden/);
const guardProofAttempts = blockedNetworkAttempts;

const realDate = Date;
const fixture = globalThis.__locationWorkflowFixture = { role: "admin", now: "2026-10-06T12:00:00Z", tables: { location_pages: [], content_revisions: [] }, calls: [], revalidated: [], sequence: 0 };
class FixtureDate extends realDate { constructor(...args) { super(...(args.length ? args : [fixture.now])); } static now() { return realDate.parse(fixture.now); } }
globalThis.Date = FixtureDate;
const clone = (value) => JSON.parse(JSON.stringify(value));
async function renderAsync(element) {
  const output = new PassThrough();
  let html = "";
  await new Promise((resolve, reject) => {
    output.on("data", (chunk) => { html += chunk.toString(); });
    output.on("end", resolve); output.on("error", reject);
    const renderer = renderToPipeableStream(element, { onAllReady() { renderer.pipe(output); }, onError: reject });
  });
  return html;
}
const mainId = "00000000-0000-4000-8000-000000009811";
const otherId = "00000000-0000-4000-8000-000000009812";
const peerId = "00000000-0000-4000-8000-000000009813";
const actorId = "00000000-0000-4000-8000-000000009899";
const root = pathToFileURL(`${process.cwd()}/`).href;
const urlFor = (path) => new URL(path, root).href;
const sources = {
  "lib/auth.ts": `const f=globalThis.__locationWorkflowFixture; export async function requireAdmin(){if(f.role!=='admin')throw new Error('Admin required');return {userId:'${actorId}',role:'admin'};} export async function createAuthorizedAdminClient(){await requireAdmin();return f.client(false);} export async function createAuthorizedSeoClient(){if(!['admin','seo_editor'].includes(f.role))throw new Error('Editor required');return f.client(false);}`,
  "utils/supabase/server.ts": `export async function createClient(){const f=globalThis.__locationWorkflowFixture;if(f.role!=='admin')throw new Error('Admin required');return f.client(false);}`,
  "utils/supabase/public.ts": `export function publicClient(){return globalThis.__locationWorkflowFixture.client(true);}`,
  "lib/cms/queries.ts": `import {resolveSiteConfig} from '@/lib/site-config';const services=[{name:'Service rendering fixture',href:'/services/speeding',content:{intro:'Private fixture introduction.'}}];export async function getServices(){return services;}export async function getSiteConfig(){return resolveSiteConfig({});}export async function getRouteIndex(){return {services,articles:[]};}export async function getSeoOverrides(){return {};}`,
  "lib/cms/seo/overrides.ts": `export async function moveSeoOverride(){throw new Error('Unexpected slug/SEO mutation in workflow fixture');}export async function dropSeoOverride(){globalThis.__locationWorkflowFixture.calls.push({isolatedSeoCleanup:true});}`,
  "lib/cms/seo/publication-check.ts": `export async function getPublicationSeoWarnings(){return [];}`,
  "lib/cms/revalidate.ts": `export function revalidateFor(entity,targets){globalThis.__locationWorkflowFixture.revalidated.push({entity,targets});}`,
  "lib/cms/seo/revision-validation.ts": `export async function validateSeoRevision(){throw new Error('Unexpected SEO restore');}export async function validateRobotsRevision(){throw new Error('Unexpected robots restore');}`,
  "lib/cms/seo/sitemap-queries.ts": `export async function getSitemapDateSources(){return {sections:[],seo:[],settings:[],media:[],services:[],articles:[]};}`,
  "lib/cms/seo/metadata.ts": `import {siteNodes} from '@/lib/cms/seo/json-ld';import {resolveSiteConfig} from '@/lib/site-config';export async function structuredDataFor(path,title){return {page:{path,title,canonical:path,description:'Private rendering fixture.'},site:siteNodes({config:resolveSiteConfig({}),practiceAreas:[],portrait:'/john-violaris-portrait.webp'})};}`,
};
const hook = registerHooks({
  resolve(specifier, context, next) {
    if (["server-only", "next/cache", "next/navigation"].includes(specifier)) return { url: `location-fixture:${specifier}`, shortCircuit: true };
    if (["next/image", "next/link"].includes(specifier)) return next(`${specifier}.js`, context);
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url === "location-fixture:server-only") return { format: "module", shortCircuit: true, source: "" };
    if (url === "location-fixture:next/cache") return { format: "module", shortCircuit: true, source: "export function revalidatePath(path){globalThis.__locationWorkflowFixture.revalidated.push({path});}" };
    if (url === "location-fixture:next/navigation") return { format: "module", shortCircuit: true, source: "export function redirect(path){const e=new Error('Fixture redirect');e.fixtureRedirect=path;throw e;}export function notFound(){throw new Error('Fixture not found');}export function usePathname(){return '/preview/locations/fixture';}" };
    const source = Object.entries(sources).find(([path]) => urlFor(path) === url)?.[1];
    if (source !== undefined) return { format: "module", shortCircuit: true, source };
    if (url.startsWith(root) && url.endsWith(".tsx")) return { format: "module", shortCircuit: true, source: ts.transpileModule(readFileSync(new URL(url), "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText };
    return next(url, context);
  },
});
try {
  const { isPubliclyVisible, publicationStatus } = await import("../lib/cms/publication.ts");
  fixture.client = (publicRead) => ({ from(table) {
    if (!["location_pages", "content_revisions"].includes(table)) throw new Error("Unexpected fixture table access");
    fixture.calls.push({ table, publicRead });
    let operation = "read", patch, columns = "*", order, limit = 500;
    const predicates = [];
    let settled;
    const execute = () => {
      if (settled) return settled;
      let found = fixture.tables[table].filter((row) => predicates.every((predicate) => predicate(row)));
      if (publicRead) { assert.equal(operation, "read"); found = found.filter((row) => table === "location_pages" && row.reviewed_at && isPubliclyVisible(row)); }
      if (operation !== "read") {
        assert.equal(publicRead, false); assert.equal(table, "location_pages"); assert.equal(fixture.role, "admin");
        if (operation === "insert") { assert.equal(fixture.tables[table].some((row) => row.id === mainId), false); found = [{ id: mainId, ...clone(patch), created_at: fixture.now, updated_at: fixture.now }]; fixture.tables[table].push(...found); }
        if (operation === "update") for (const row of found) Object.assign(row, clone(patch), { updated_at: fixture.now });
        // Audit capture is simulated; production SQL capture is a separate gate.
        for (const row of found) fixture.tables.content_revisions.push({ id: `00000000-0000-4000-8000-${String(++fixture.sequence).padStart(12, "0")}`, revision_number: fixture.sequence, entity_table: table, entity_id: row.id, entity_key: row.id, snapshot: clone(row), operation: operation === "insert" ? "create" : operation, actor_id: actorId, created_at: fixture.now });
        if (operation === "delete") fixture.tables[table] = fixture.tables[table].filter((row) => !found.includes(row));
      }
      if (order) found.sort((a, b) => String(a[order.key]).localeCompare(String(b[order.key])) * (order.ascending ? 1 : -1));
      found = found.slice(0, limit).map((row) => columns === "*" ? clone(row) : Object.fromEntries(columns.split(",").map((key) => [key, row[key]])));
      settled = { data: found, error: null }; return settled;
    };
    const chain = { select(value = "*") { columns = value; return chain; }, eq(key, value) { predicates.push((row) => row[key] === value); return chain; }, not(key, _operator, value) { predicates.push((row) => row[key] !== value); return chain; }, order(key, options = {}) { order = { key, ascending: options.ascending !== false }; return chain; }, limit(value) { limit = value; return chain; }, insert(value) { operation = "insert"; patch = value; return chain; }, update(value) { operation = "update"; patch = value; return chain; }, delete() { operation = "delete"; return chain; }, async single() { const result = execute(); return { ...result, data: result.data[0] ?? null }; }, async maybeSingle() { return chain.single(); }, async returns() { return execute(); }, then(resolve, reject) { return Promise.resolve(execute()).then(resolve, reject); } };
    return chain;
  } });
  const { saveLocationPage, deleteLocationPage } = await import("../lib/cms/locations/actions.ts");
  const { initialLocationFormState, emptyLocationValues, locationValuesFrom } = await import("../lib/cms/locations/schema.ts");
  const { getLocationPageAdmin } = await import("../lib/cms/locations/admin-queries.ts");
  const { getLocationPage, getLocationPages } = await import("../lib/cms/locations/queries.ts");
  const { listContentRevisions, getContentRevision } = await import("../lib/cms/revisions/queries.ts");
  const { restoreContentRevision } = await import("../lib/cms/revisions/actions.ts");
  const { default: PreviewLocation } = await import("../app/preview/locations/[id]/page.tsx");
  const { LocationPageContent } = await import("../components/pages/location-page-content.tsx");
  const { getSiteConfig, getServices } = await import("../lib/cms/queries.ts");
  const { validateSchemaNodes } = await import("../lib/cms/seo/schema-validation.ts");
  const { faqCountField, faqField, faqAnswerText } = await import("../lib/cms/faq.ts");
  const { courtCountField, courtField } = await import("../lib/cms/locations/structured.ts");
  const { default: sitemap } = await import("../app/sitemap.ts");
  const marker = "Private workflow fixture; never published on a real backend.";
  const words = (prefix, count) => Array.from({ length: count }, (_, index) => `${prefix}${index}`).join(" ");
  const values = { ...emptyLocationValues, slug: "qa-location-workflow-fixture", location: "Private workflow fixture", title: "Private workflow fixture heading", description: "Private workflow fixture search description, not real local advice.", intro: marker, localContext: words("fixturecontext", 90), localContextRich: `**Synthetic context fixture.** ${words("richfixturecontext", 90)} [Fixture instructions](/contact).`, body: `${words("fixturebody", 160)}\n\n${words("fixtureparagraph", 160)}`, relatedServices: "/services/speeding" };
  const faq = { question: "How does this private fixture work?", answer: "This is **synthetic module data**, never real legal advice." };
  const court = { name: "Synthetic court fixture", details: "Private fixture details, not facts about any real court.", address: "Synthetic fixture address", officialUrl: "https://www.gov.uk/find-court-tribunal", directionsUrl: "" };
  const protectedOther = { id: otherId, slug: "untouched-fixture", title: "Unrelated in-memory row", published: false, content: { ...values, localContext: [], body: [], relatedServices: [] }, reviewed_at: null };
  fixture.tables.location_pages.push(clone(protectedOther));
  const protectedHistory = { id: "00000000-0000-4000-8000-000000008888", entity_table: "location_pages", entity_id: otherId, entity_key: otherId, operation: "baseline", snapshot: clone(protectedOther), revision_number: 8888 };
  fixture.tables.content_revisions.push(clone(protectedHistory));
  const form = (overrides = {}, published = false, reviewed = false, existing = true) => {
    const output = new FormData(); for (const [key, value] of Object.entries({ ...values, ...overrides })) output.set(key, value);
    output.set(faqCountField, "1"); for (const [key, value] of Object.entries(faq)) output.set(faqField(0, key), value);
    output.set(courtCountField, "1"); for (const [key, value] of Object.entries(court)) output.set(courtField(0, key), value);
    if (existing) output.set("id", mainId); if (published) output.set("published", "on"); if (reviewed) output.set("legalReviewed", "on"); return output;
  };
  await assert.rejects(saveLocationPage(initialLocationFormState, form({}, false, false, false)), (error) => error.fixtureRedirect === `/admin/location-pages/${mainId}`);
  assert.equal((await getLocationPageAdmin(mainId)).content.intro, marker);
  assert.equal((await getLocationPageAdmin(mainId)).content.faqItems[0].question, faq.question);
  assert.equal((await getLocationPageAdmin(mainId)).content.courts[0].name, court.name);
  assert.equal((await getLocationPageAdmin(mainId)).content.localContextRich, values.localContextRich);
  assert.equal(await getLocationPage(values.slug), null);
  assert.equal((await sitemap()).some((row) => row.url.endsWith(`/locations/${values.slug}`)), false);
  const preview = await renderAsync(await PreviewLocation({ params: Promise.resolve({ id: mainId }), searchParams: Promise.resolve({}) }));
  assert.ok(preview.includes(marker)); assert.doesNotMatch(preview, /application\/ld\+json/);
  assert.ok(preview.includes(faq.question)); assert.ok(preview.includes(court.name)); assert.ok(preview.includes("<strong>Synthetic context fixture.</strong>"));
  fixture.role = "anonymous"; const readsBefore = fixture.calls.length;
  await assert.rejects(getLocationPageAdmin(mainId), /Admin required/); assert.equal(fixture.calls.length, readsBefore);
  await assert.rejects(saveLocationPage(initialLocationFormState, form()), /Admin required/);
  fixture.role = "admin";
  const writesBefore = fixture.sequence;
  assert.equal((await saveLocationPage(initialLocationFormState, form({}, true, false))).status, "error"); assert.equal(fixture.sequence, writesBefore);
  assert.equal((await saveLocationPage(initialLocationFormState, form({ title: "Changed private fixture heading" }))).status, "success");
  const history = await listContentRevisions("location_pages", mainId); assert.equal(history.available, true); assert.equal(history.revisions.length, 2);
  const firstRevision = history.revisions.at(-1).id;
  const firstSnapshot = await getContentRevision("location_pages", mainId, firstRevision);
  assert.equal(firstSnapshot.title, values.title);
  const historicalPreview = await renderAsync(await PreviewLocation({ params: Promise.resolve({ id: mainId }), searchParams: Promise.resolve({ revision: firstRevision }) }));
  assert.ok(historicalPreview.includes("Historical version preview.")); assert.ok(historicalPreview.includes(values.title)); assert.equal(historicalPreview.includes("Changed private fixture heading"), false); assert.doesNotMatch(historicalPreview, /application\/ld\+json/);
  const revisionForm = new FormData(); revisionForm.set("revisionId", firstRevision);
  fixture.role = "seo_editor"; await assert.rejects(restoreContentRevision({ status: "idle", message: "" }, revisionForm), /Admin required/);
  fixture.role = "admin";
  assert.equal((await saveLocationPage(initialLocationFormState, form({}, true, true))).status, "success");
  assert.ok(await getLocationPage(values.slug));
  assert.equal((await restoreContentRevision({ status: "idle", message: "" }, revisionForm)).status, "success");
  assert.equal((await getLocationPageAdmin(mainId)).published, false); assert.equal((await getLocationPageAdmin(mainId)).title, values.title);
  assert.equal(await getLocationPage(values.slug), null);
  assert.equal((await getLocationPageAdmin(mainId)).content.localContextRich, values.localContextRich);
  assert.deepEqual((await getLocationPageAdmin(mainId)).content.courts, firstSnapshot.content.courts);
  assert.deepEqual((await getLocationPageAdmin(mainId)).content.faqItems, firstSnapshot.content.faqItems);
  assert.equal((await saveLocationPage(initialLocationFormState, form({ publishedAt: "2026-10-06T14:00", unpublishAt: "2026-10-06T14:10" }, true, true))).status, "success");
  const scheduled = await getLocationPageAdmin(mainId); assert.equal(scheduled.published_at, "2026-10-06T13:00:00.000Z"); assert.equal(publicationStatus(scheduled), "scheduled");
  assert.equal(await getLocationPage(values.slug), null); assert.equal((await sitemap()).some((row) => row.url.endsWith(`/locations/${values.slug}`)), false);
  fixture.now = "2026-10-06T13:00:00Z";
  assert.ok(await getLocationPage(values.slug)); assert.ok((await sitemap()).some((row) => row.url.endsWith(`/locations/${values.slug}`)));
  const liveHtml = renderToStaticMarkup(await LocationPageContent({ location: await getLocationPage(values.slug), services: await getServices(), config: await getSiteConfig(), locations: await getLocationPages() }));
  const graph = JSON.parse(liveHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])["@graph"]; assert.deepEqual(validateSchemaNodes(graph), []);
  assert.equal(graph.find((node) => node["@type"] === "FAQPage").mainEntity[0].acceptedAnswer.text, faqAnswerText(faq.answer));
  assert.equal(graph.find((node) => node["@type"] === "LegalService").address, undefined);
  const peer = { ...clone(scheduled), id: peerId, slug: "qa-peer-fixture", location: "Related private fixture", content: { ...clone(scheduled.content), localContext: [words("peercontext", 90)], localContextRich: undefined }, unpublish_at: null };
  fixture.tables.location_pages.push(peer);
  const linkedValues = { ...locationValuesFrom(await getLocationPageAdmin(mainId)), relatedLocations: `/locations/${peer.slug}` };
  assert.equal((await saveLocationPage(initialLocationFormState, form(linkedValues, true, true))).status, "success");
  const linkedHtml = renderToStaticMarkup(await LocationPageContent({ location: await getLocationPage(values.slug), services: await getServices(), config: await getSiteConfig(), locations: await getLocationPages() }));
  assert.ok(linkedHtml.includes(`href="/locations/${peer.slug}"`));
  peer.published = false;
  const withdrawnPeerHtml = renderToStaticMarkup(await LocationPageContent({ location: await getLocationPage(values.slug), services: await getServices(), config: await getSiteConfig(), locations: await getLocationPages() })); assert.equal(withdrawnPeerHtml.includes(`href="/locations/${peer.slug}"`), false);
  fixture.now = "2026-10-06T13:10:00Z"; assert.equal(publicationStatus(await getLocationPageAdmin(mainId)), "expired"); assert.equal(await getLocationPage(values.slug), null); assert.equal((await sitemap()).some((row) => row.url.endsWith(`/locations/${values.slug}`)), false);
  assert.equal((await saveLocationPage(initialLocationFormState, form())).status, "success"); assert.equal(await getLocationPage(values.slug), null);
  await assert.rejects(deleteLocationPage({ message: null }, (() => { const f = new FormData(); f.set("id", mainId); return f; })()), (error) => error.fixtureRedirect === "/admin/location-pages");
  fixture.tables.location_pages = fixture.tables.location_pages.filter((row) => row.id !== peerId);
  fixture.tables.content_revisions = fixture.tables.content_revisions.filter((row) => ![mainId, peerId].includes(row.entity_id));
  assert.deepEqual(fixture.tables.location_pages, [protectedOther]); assert.deepEqual(fixture.tables.content_revisions, [protectedHistory]);
  assert.equal(blockedNetworkAttempts, guardProofAttempts, "Application modules made no network attempts.");
  console.log(JSON.stringify({ mode: "fixtures", completed: true, actualModules: ["location save/delete actions", "admin/public location queries", "revision list/read/restore", "private preview renderer", "public location renderer", "route registry/sitemap"], scenarios: ["draft save", "private preview", "court/FAQ/rich-context save and restore", "anonymous denied before read/write", "fresh review required", "immediate publish", "history restore as draft", "SEO editor restore denied", "London scheduling", "scheduled hidden", "start boundary visible", "schema valid", "related link withdrawal", "end boundary hidden", "withdrawal", "owned fixture cleanup"], networkCalls: 0, applicationNetworkAttempts: 0, networkGuardProbes: guardProofAttempts, hostedWrites: 0, actualBackendAcceptance: "not run", limitations: ["In-memory database, audit capture and publication/RLS filtering are simulated.", "No real Auth, RLS, Storage, HTTP/ISR caching, browser sessions or email acceptance."] }));
} finally { hook.deregister(); globalThis.Date = realDate; }
