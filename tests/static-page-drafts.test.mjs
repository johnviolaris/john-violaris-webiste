import assert from "node:assert/strict";
import test from "node:test";
import { applySectionDrafts, isStaticPreviewPath, readSectionWorkflow, sectionEditorConflict, sectionPreviewPaths } from "../lib/cms/sections/drafts.ts";
import { findSection } from "../lib/cms/sections/schema.ts";

function workflow() {
  const form = new FormData();
  for (const [key, value] of Object.entries({ workflowVersion: "1", intent: "draft", expectedLiveContent: "null", expectedDraftId: "", expectedDraftVersion: "" })) form.set(key, value);
  return form;
}

test("static preview targets are exact registered pages, with no private, dynamic or external paths", () => {
  for (const path of ["/", "/about", "/services", "/police-station", "/fees", "/reviews", "/contact", "/cookies", "/privacy"]) assert.equal(isStaticPreviewPath(path), true);
  for (const path of ["/admin", "/auth", "/preview", "/blog/private", "/services/drink-driving", "//example.test", "https://example.test", "/about/", "/%61bout", "/about?next=/admin", "", null]) assert.equal(isStaticPreviewPath(path), false);
});

test("saved section preview overlays just that section on pages where it is actually rendered", () => {
  const live = { home: { hero: { eyebrow: "Live" }, "offence-strip": { eyebrow: "Unchanged" } }, "police-station": { feature: { eyebrow: "Live police" } }, shared: { cta: { eyebrow: "Live CTA" } } };
  const before = structuredClone(live);
  const drafts = [{ page: "police-station", section: "feature", content: { eyebrow: "Private police" } }, { page: "home", section: "hero", content: { eyebrow: "Private hero" } }, { page: "unknown", section: "anything", content: { eyebrow: "Ignore" } }];
  const preview = applySectionDrafts(live, drafts, "/police-station");
  assert.equal(preview["police-station"].feature.eyebrow, "Private police");
  assert.equal(preview.home.hero.eyebrow, "Live");
  assert.deepEqual(live, before);
  preview["police-station"].feature.eyebrow = "Preview-only mutation";
  assert.equal(drafts[0].content.eyebrow, "Private police");
  assert.deepEqual(applySectionDrafts(live, drafts, "/admin"), live);
});

test("shared CTA previews exclude Contact, which has no closing CTA", () => {
  const paths = sectionPreviewPaths(findSection("shared", "cta"));
  assert.equal(paths.includes("/contact"), false);
  assert.equal(paths.includes("/about"), true);
  assert.deepEqual(sectionPreviewPaths(findSection("police-station", "intro")), ["/police-station"]);
});

test("explicit publication workflow preserves recorded live content and draft identity/version", () => {
  const form = workflow();
  assert.deepEqual(readSectionWorkflow(form), { ok: true, intent: "draft", expectedLiveContent: null, expectedDraftId: null, expectedDraftVersion: null });
  form.set("intent", "publish");
  form.set("expectedLiveContent", '{"headline":["Current live copy"]}');
  form.set("expectedDraftId", "00000000-0000-4000-8000-000000006611");
  form.set("expectedDraftVersion", "2");
  assert.deepEqual(readSectionWorkflow(form), { ok: true, intent: "publish", expectedLiveContent: { headline: ["Current live copy"] }, expectedDraftId: "00000000-0000-4000-8000-000000006611", expectedDraftVersion: 2 });
});

test("legacy, missing and malformed publication tokens fail closed instead of publishing or resetting", () => {
  for (const key of ["workflowVersion", "intent", "expectedLiveContent", "expectedDraftId", "expectedDraftVersion"]) {
    const form = workflow(); form.delete(key); assert.equal(readSectionWorkflow(form).ok, false, key);
  }
  for (const [key, value] of [["intent", "unknown"], ["workflowVersion", "0"], ["expectedLiveContent", "[]"], ["expectedLiveContent", "1"], ["expectedLiveContent", "{broken"], ["expectedDraftId", "not-a-uuid"], ["expectedDraftVersion", "1"], ["expectedDraftVersion", "9007199254740993"]]) {
    const form = workflow(); form.set(key, value); assert.equal(readSectionWorkflow(form).ok, false, `${key}:${value}`);
  }
});

test("an external restore cannot advance displayed fields' tokens; live conflicts still permit deliberate discard", () => {
  const token = { liveContent: { headline: ["Live"], eyebrow: "Live eyebrow" }, draftId: "old-draft", draftVersion: 2 };
  assert.equal(sectionEditorConflict(token, { eyebrow: "Live eyebrow", headline: ["Live"] }, { id: "old-draft", version: 2, base_content: token.liveContent }), null);
  assert.equal(sectionEditorConflict(token, token.liveContent, { id: "restored-draft", version: 2, base_content: token.liveContent }), "draft-changed");
  assert.equal(sectionEditorConflict(token, token.liveContent, { id: "old-draft", version: 3, base_content: token.liveContent }), "draft-changed");
  assert.equal(sectionEditorConflict(token, { headline: ["New live"] }, { id: "old-draft", version: 2, base_content: token.liveContent }), "live-changed");
  assert.equal(sectionEditorConflict(token, token.liveContent, null), "draft-changed");
});
