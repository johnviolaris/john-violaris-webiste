/** Actual server actions/queries and form rendering with isolated, non-network fixtures. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { findSection, initialSectionFormState, pageGroups } from "../lib/cms/sections/schema.ts";
import { fieldName } from "../lib/cms/sections/schema.ts";
import { sectionPreviewPaths } from "../lib/cms/sections/drafts.ts";

const uuid = "00000000-0000-4000-8000-000000006611";
const oldUuid = "00000000-0000-4000-8000-000000006612";
const rootUrl = pathToFileURL(`${process.cwd()}/`).href;
const moduleUrl = (path) => new URL(path, rootUrl).href;
const fixture = globalThis.__staticPreviewFixture = {};
function reset() {
  Object.assign(fixture, { allowed: true, role: "admin", calls: [], revalidated: [], tables: {}, live: { home: {}, shared: {} }, asset: null, seoThrows: false, rpcError: null, rpcData: null });
}
reset();
fixture.client = {
  from(table) {
    fixture.calls.push({ table });
    const filters = [];
    const result = () => ({ data: (fixture.tables[table] ?? []).filter((row) => filters.every(([key, values]) => values.includes(row[key]))), error: null });
    const chain = {
      select() { return chain; }, eq(key, value) { filters.push([key, [value]]); return chain; }, in(key, values) { filters.push([key, values]); return chain; },
      async maybeSingle() { const value = result(); return { ...value, data: value.data[0] ?? null }; },
      async returns() { return result(); }, then(resolve, reject) { return Promise.resolve(result()).then(resolve, reject); },
    };
    return chain;
  },
  async rpc(name, args) { fixture.calls.push({ rpc: name, args }); return { data: fixture.rpcData, error: fixture.rpcError }; },
};
const sources = {
  "lib/auth.ts": `
    const f=globalThis.__staticPreviewFixture;
    export async function createAuthorizedAdminClient(){ if(!f.allowed||f.role!=='admin') throw new Error('Admin required'); return f.client; }
    export async function requireAdmin(){ if(!f.allowed||f.role!=='admin') throw new Error('Admin required'); }
    export async function createAuthorizedSeoClient(){ if(!f.allowed) throw new Error('Editor required'); return f.client; }
  `,
  "lib/cms/queries.ts": `export async function getPagesContent(){ return globalThis.__staticPreviewFixture.live; }`,
  "lib/cms/media/queries.ts": `export async function getMediaAssetForUrl(url){const f=globalThis.__staticPreviewFixture;f.calls.push({media:url});return f.asset;}`,
  "lib/cms/revisions/queries.ts": `export async function getContentRevision(table,key,id){return (globalThis.__staticPreviewFixture.tables.content_revisions??[]).find(row=>row.entity_table===table&&row.entity_key===key&&row.id===id)?.snapshot??null;}`,
  "lib/cms/seo/routes.ts": `export async function listSeoRoutes(){if(globalThis.__staticPreviewFixture.seoThrows)throw new Error('Advisory outage');return [];}`,
  "lib/cms/seo/publication-check.ts": `export async function getPublicationSeoWarnings(){return [];}`,
  "lib/cms/revalidate.ts": `export function revalidateFor(entity,targets){globalThis.__staticPreviewFixture.revalidated.push({entity,targets});}`,
  "lib/cms/seo/overrides.ts": `export async function moveSeoOverride(){throw new Error('Unexpected SEO write');}`,
  "lib/cms/seo/revision-validation.ts": `export async function validateSeoRevision(){throw new Error('Unexpected SEO restore');} export async function validateRobotsRevision(){throw new Error('Unexpected robots restore');}`,
  "components/layout/analytics.tsx": `export function useEnquiryTracking(){}`,
  "components/layout/enquiry-attribution.tsx": `export const enquiryAttributionUpdatedEvent='fixture-attribution';export function readStoredEnquiryAttribution(){throw new Error('Preview read attribution');}`,
  "lib/enquiries/actions.ts": `
    export function submitEnquiry(){throw new Error('No enquiries may be submitted in this fixture');}
    const descriptor=()=>({method:'post',action:'/fixture-enquiry',encType:'multipart/form-data',name:'$ACTION_ID_fixture',data:new FormData()});
    submitEnquiry.$$FORM_ACTION=descriptor;
    submitEnquiry.bind=(...args)=>{const bound=Function.prototype.bind.apply(submitEnquiry,args);bound.$$FORM_ACTION=descriptor;return bound;};
  `,
};
const hook = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (["server-only", "next/cache", "next/navigation", "next/link"].includes(specifier)) return { url: `fixture:${specifier}`, shortCircuit: true };
    if (context.parentURL?.startsWith("fixture:")) return nextResolve(specifier, { ...context, parentURL: moduleUrl("scripts/verify-static-previews.mjs") });
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url === "fixture:server-only") return { format: "module", shortCircuit: true, source: "" };
    if (url === "fixture:next/cache") return { format: "module", shortCircuit: true, source: "export function revalidatePath(path,type){globalThis.__staticPreviewFixture.revalidated.push({path,type});}" };
    if (url === "fixture:next/navigation") return { format: "module", shortCircuit: true, source: "export function usePathname(){return '/preview/pages/fixture';}" };
    if (url === "fixture:next/link") return { format: "module", shortCircuit: true, source: "import {createElement} from 'react';export default function Link(props){return createElement('a',props);}" };
    const source = Object.entries(sources).find(([path]) => moduleUrl(path) === url)?.[1];
    if (source !== undefined) return { format: "module", shortCircuit: true, source };
    if (url.startsWith(rootUrl) && url.endsWith(".tsx")) return { format: "module", shortCircuit: true, source: ts.transpileModule(readFileSync(new URL(url), "utf8"), { compilerOptions: { module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText };
    return nextLoad(url, context);
  },
});
let getSectionEditorData, getSectionDraftPreview, savePageSection, restoreContentRevision, ContactEnquiryForm, sectionValuesFrom, validateSectionRevision, isIconName;
try {
  ({ validateSectionRevision } = await import("../lib/cms/revisions/validation.ts"));
  ({ isIconName } = await import("../components/ui/icons.tsx"));
  ({ sectionValuesFrom } = await import("../lib/cms/sections/values.ts"));
  ({ getSectionEditorData, getSectionDraftPreview } = await import("../lib/cms/sections/draft-queries.ts"));
  ({ savePageSection } = await import("../lib/cms/sections/actions.ts"));
  ({ restoreContentRevision } = await import("../lib/cms/revisions/actions.ts"));
  ({ ContactEnquiryForm } = await import("../components/sections/contact-enquiry-form.tsx"));
} finally { hook.deregister(); }

function draft(page = "home", section = "hero", content = {}) {
  return { id: uuid, page, section, content, base_content: { eyebrow: "Recorded live" }, version: 2, created_at: "2026-10-06T09:00:00Z", updated_at: "2026-10-06T10:00:00Z" };
}
function form(intent = "draft", definition = findSection("home", "hero")) {
  const value = new FormData();
  for (const [key, text] of Object.entries({ page: "home", section: "hero", workflowVersion: "1", intent, expectedLiveContent: '{"eyebrow":"Recorded live"}', expectedDraftId: oldUuid, expectedDraftVersion: "1" })) value.set(key, text);
  const fields = sectionValuesFrom(definition, definition.defaults);
  for (const field of definition.fields) {
    if (field.kind !== "items") value.set(fieldName(field.key), fields[field.key] ?? "");
  }
  return value;
}

test("all registered editable static templates preview one saved section without mutating live groups", async () => {
  for (const page of pageGroups) for (const definition of page.sections) for (const path of sectionPreviewPaths(definition)) {
    reset();
    const saved = draft(page.key, definition.key, structuredClone(definition.defaults));
    fixture.tables.page_section_drafts = [saved];
    const before = structuredClone(fixture.live);
    assert.equal(validateSectionRevision(definition, saved.content, isIconName), null, `${page.key}/${definition.key} validation`);
    const preview = await getSectionDraftPreview(uuid, path);
    assert.equal(preview?.path, path, `${page.key}/${definition.key}:${path}`);
    assert.deepEqual(preview.groups[page.key][definition.key], saved.content);
    assert.deepEqual(fixture.live, before);
  }
});

test("draft queries independently require admin before reading editor, draft or historical records", async () => {
  for (const role of ["user", "seo_editor"]) {
    reset(); fixture.role = role;
    await assert.rejects(getSectionEditorData("home"), /Admin required/);
    await assert.rejects(getSectionDraftPreview(uuid, "/"), /Admin required/);
    assert.equal(fixture.calls.length, 0);
  }
});

test("historical preview remains available after draft deletion, scoped to static snapshots", async () => {
  reset();
  fixture.tables.content_revisions = [{ id: uuid, entity_table: "page_section_drafts", snapshot: draft("police-station", "intro", { eyebrow: "Historic fixture" }) }];
  const preview = await getSectionDraftPreview(uuid, "/police-station");
  assert.equal(preview?.historical, true);
  assert.equal(preview.groups["police-station"].intro.eyebrow, "Historic fixture");
  fixture.tables.content_revisions[0].entity_table = "blog_posts";
  assert.equal(await getSectionDraftPreview(uuid, "/police-station"), null);
});

test("invalid content and unrelated or private target routes cannot produce draft previews", async () => {
  reset(); fixture.tables.page_section_drafts = [draft()];
  for (const path of ["/admin", "/about", "//evil.test", "/%61bout"]) assert.equal(await getSectionDraftPreview(uuid, path), null);
  assert.equal(await getSectionDraftPreview("bad-id", "/"), null);
  fixture.tables.page_section_drafts[0].content = { headline: { invalid: true } };
  assert.equal(await getSectionDraftPreview(uuid, "/"), null);
  const hero = findSection("home", "hero");
  const stats = hero.fields.find((field) => field.kind === "items").key;
  const optionalField = hero.fields.find((field) => field.key === stats).item.fields.find((field) => !field.required).key;
  const invalidOptional = structuredClone(hero.defaults);
  invalidOptional[stats][0][optionalField] = { invalid: true };
  fixture.tables.page_section_drafts[0].content = invalidOptional;
  assert.equal(await getSectionDraftPreview(uuid, "/"), null, "optional fields may be absent, but explicit invalid values remain rejected");
});

test("home preview applies admin-authorized current library presentation for draft-only media", async () => {
  reset(); fixture.tables.page_section_drafts = [draft("home", "hero", { portrait: "/fixture.webp", portraitAlt: "Old description" })];
  fixture.asset = { alt_text: "Current private description", is_decorative: false, title: "Current title", caption: "**Current caption**", caption_format: "markdown" };
  const preview = await getSectionDraftPreview(uuid, "/");
  assert.equal(preview.groups.home.hero.portraitAlt, "Current private description");
  assert.equal(preview.groups.home.hero.portraitTitle, "Current title");
  assert.equal(preview.groups.home.hero.portraitCaption, "**Current caption**");
  assert.equal(preview.groups.home.hero.portraitCaptionFormat, "markdown");
});

test("confirmed publication still returns fresh tokens and refreshes public pages when SEO advisories fail", async () => {
  reset(); fixture.seoThrows = true; fixture.rpcData = { draft: null, live_content: { eyebrow: "Published fixture" } };
  const result = await savePageSection(initialSectionFormState, form("publish"));
  assert.equal(result.status, "success");
  assert.equal(result.savedDraft, null);
  assert.deepEqual(result.savedLiveContent, fixture.rpcData.live_content);
  assert.match(result.message, /Publication succeeded.*advisories are temporarily unavailable/);
  assert.equal(fixture.revalidated.some((entry) => entry.entity === "page-sections"), true);
});

test("legacy and rejected editor requests preserve acknowledged tokens without ambiguous publication", async () => {
  reset(); const previous = { ...initialSectionFormState, savedDraft: { id: uuid, version: 2, base_content: { eyebrow: "Recorded live" } }, savedLiveContent: { eyebrow: "Recorded live" } };
  const legacy = form(); legacy.delete("expectedDraftId");
  const rejected = await savePageSection(previous, legacy);
  assert.equal(rejected.status, "error");
  assert.deepEqual(rejected.savedDraft, previous.savedDraft);
  assert.equal(fixture.calls.some((entry) => entry.rpc), false);
  fixture.rpcError = { code: "P0001", message: "Draft changed; reload" };
  const failed = await savePageSection(previous, form());
  assert.equal(failed.status, "error");
  assert.deepEqual(failed.savedDraft, previous.savedDraft);
  assert.deepEqual(failed.savedLiveContent, previous.savedLiveContent);
  assert.equal(fixture.revalidated.length, 0);
});

test("section history restore uses the form's recorded token and creates only a private draft", async () => {
  reset(); fixture.tables.content_revisions = [{ id: uuid, entity_table: "page_sections", entity_id: oldUuid, snapshot: { page: "police-station", section: "intro", content: { eyebrow: "Historic fixture" } } }];
  fixture.rpcData = { draft: draft(), live_content: { eyebrow: "Recorded live" } };
  const value = form(); value.set("revisionId", uuid);
  const result = await restoreContentRevision({ status: "idle", message: "" }, value);
  assert.equal(result.status, "success");
  const saved = fixture.calls.find((entry) => entry.rpc).args;
  assert.equal(saved.p_intent, "draft");
  assert.equal(saved.p_expected_draft_id, oldUuid);
  assert.equal(saved.p_expected_draft_version, 1);
  assert.deepEqual(saved.p_expected_live_content, { eyebrow: "Recorded live" });
  assert.equal(fixture.revalidated.some((entry) => entry.entity || entry.path === "/sitemap.xml"), false);
  value.delete("expectedDraftId"); fixture.calls.length = 0;
  assert.equal((await restoreContentRevision({ status: "idle", message: "" }, value)).status, "error");
  assert.equal(fixture.calls.some((entry) => entry.rpc), false);
});

test("private Contact preview retains public form wording but has disabled controls and no enquiry action", () => {
  reset();
  const preview = renderToStaticMarkup(createElement(ContactEnquiryForm, { readOnly: true }));
  const live = renderToStaticMarkup(createElement(ContactEnquiryForm));
  assert.match(preview, /<fieldset disabled=""/);
  assert.doesNotMatch(preview, /action="\/fixture-enquiry"|\$ACTION_ID_fixture/);
  assert.match(live, /action="\/fixture-enquiry"/);
  assert.doesNotMatch(live, /<fieldset disabled=""/);
  for (const text of ["Tell John about", "your case.", "First name", "Email address"]) {
    assert.ok(preview.includes(text), text);
    assert.ok(live.includes(text), text);
  }
});
