import { pageIntroDefaults } from "@/lib/content/pages";
import { findSection, type SectionContent, type SectionDefinition } from "@/lib/cms/sections/schema";

export type PageContentGroups = Record<string, Record<string, SectionContent>>;
export type SectionDraft = {
  id: string;
  page: string;
  section: string;
  content: SectionContent;
  base_content: SectionContent | null;
  version: number;
  created_at: string;
  updated_at: string;
};
export type SectionDraftToken = Pick<SectionDraft, "id" | "version" | "base_content">;
export type SectionWorkflowToken = { liveContent: SectionContent | null; draftId: string | null; draftVersion: number | null };

function canonical(value: unknown): string {
  return JSON.stringify(value, (_key, entry) => entry && typeof entry === "object" && !Array.isArray(entry)
    ? Object.fromEntries(Object.entries(entry).sort(([a], [b]) => a.localeCompare(b))) : entry);
}

/** The editor's displayed fields retain their original tokens on an external refresh. */
export function sectionEditorConflict(token: SectionWorkflowToken, live: SectionContent | null, draft: SectionDraftToken | null): "draft-changed" | "live-changed" | null {
  if (token.draftId !== (draft?.id ?? null) || token.draftVersion !== (draft?.version ?? null)) return "draft-changed";
  return canonical(token.liveContent) === canonical(live) ? null : "live-changed";
}

export function isStaticPreviewPath(path: unknown): path is string {
  return typeof path === "string" && (path === "/" || Object.keys(pageIntroDefaults).some((page) => path === `/${page}`));
}

export function sectionPreviewPaths(definition: SectionDefinition): string[] {
  const paths = ["/", ...Object.keys(pageIntroDefaults).map((page) => `/${page}`)];
  return paths.filter((path) => (definition.appearsOn.includes("*") || definition.appearsOn.includes(path))
    // The contact page deliberately has no closing CTA.
    && !(definition.key === "cta" && path === "/contact"));
}

/** Copy-on-write overlays; the public read and its cached objects stay untouched. */
export function applySectionDrafts(live: PageContentGroups, drafts: Pick<SectionDraft, "page" | "section" | "content">[], path: string): PageContentGroups {
  const result = Object.fromEntries(Object.entries(live).map(([page, sections]) => [page, { ...sections }]));
  if (!isStaticPreviewPath(path)) return result;
  for (const draft of drafts) {
    const definition = findSection(draft.page, draft.section);
    if (!definition || !sectionPreviewPaths(definition).includes(path)) continue;
    (result[draft.page] ??= {})[draft.section] = { ...draft.content };
  }
  return result;
}

/** Missing workflow fields are stale forms, never implicit publication. */
export function readSectionWorkflow(form: FormData):
  | { ok: true; intent: "draft" | "publish" | "discard" | "reset"; expectedLiveContent: SectionContent | null; expectedDraftId: string | null; expectedDraftVersion: number | null }
  | { ok: false; error: string } {
  const invalid = { ok: false as const, error: "This editor has changed. Reload before saving or publishing; your live content has not been changed." };
  const intent = form.get("intent");
  const live = form.get("expectedLiveContent");
  const version = form.get("expectedDraftVersion");
  const id = form.get("expectedDraftId");
  if (form.get("workflowVersion") !== "1" || !["draft", "publish", "discard", "reset"].includes(String(intent)) || typeof live !== "string" || typeof version !== "string" || typeof id !== "string") return invalid;
  if ((id === "") !== (version === "") || (id && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))) return invalid;
  const expectedDraftVersion = version === "" ? null : Number(version);
  if (version && (!/^[1-9]\d*$/.test(version) || !Number.isSafeInteger(expectedDraftVersion))) return invalid;
  try {
    const expectedLiveContent = JSON.parse(live);
    if (expectedLiveContent !== null && (typeof expectedLiveContent !== "object" || Array.isArray(expectedLiveContent))) return invalid;
    return { ok: true, intent: intent as "draft" | "publish" | "discard" | "reset", expectedLiveContent, expectedDraftId: id || null, expectedDraftVersion };
  } catch { return invalid; }
}
