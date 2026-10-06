import "server-only";
import { createAuthorizedAdminClient } from "@/lib/auth";
import { getPagesContent } from "@/lib/cms/queries";
import { findSection, type SectionContent } from "@/lib/cms/sections/schema";
import { applySectionDrafts, isStaticPreviewPath, sectionPreviewPaths, type SectionDraft } from "@/lib/cms/sections/drafts";
import { getContentRevision } from "@/lib/cms/revisions/queries";
import { validateSectionRevision } from "@/lib/cms/revisions/validation";
import { isIconName } from "@/components/ui/icons";
import { getMediaAssetForUrl } from "@/lib/cms/media/queries";
import { mediaPresentation } from "@/lib/cms/media/schema";
import { heroDefaults } from "@/lib/content/pages";

export async function getSectionEditorData(page: string) {
  const client = await createAuthorizedAdminClient();
  const [live, saved] = await Promise.all([
    client.from("page_sections").select("section,content").eq("page", page).returns<{section: string; content: SectionContent}[]>(),
    client.from("page_section_drafts").select("*").eq("page", page).returns<SectionDraft[]>(),
  ]);
  return {
    live: Object.fromEntries((live.data ?? []).map((row) => [row.section, row.content])),
    drafts: Object.fromEntries((saved.data ?? []).map((row) => [row.section, row])),
    available: !live.error && !saved.error,
  };
}

export async function getSectionDraftPreview(id: string, path: string | undefined, revisionId?: string) {
  const client = await createAuthorizedAdminClient();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
  const { data: current } = await client.from("page_section_drafts").select("*").eq("id", id).maybeSingle<SectionDraft>();
  let draft = current;
  let historical = false;
  if (!current) {
    // Revision UUIDs also work after the current draft has been published or
    // discarded. This lookup remains independently admin-authorized.
    const { data: version, error: versionError } = await client.from("content_revisions")
      .select("snapshot").eq("id", id).in("entity_table", ["page_sections", "page_section_drafts"])
      .maybeSingle<{ snapshot: SectionDraft }>();
    if (versionError || !version || revisionId) return null;
    draft = version.snapshot;
    historical = true;
  } else if (revisionId) {
    draft = await getContentRevision("page_section_drafts", `${current.page}/${current.section}`, revisionId) as SectionDraft | null;
    historical = true;
  }
  if (!draft || !draft.content || typeof draft.content !== "object" || Array.isArray(draft.content)) return null;
  const definition = findSection(draft.page, draft.section);
  if (!definition) return null;
  const target = path ?? sectionPreviewPaths(definition)[0];
  if (!isStaticPreviewPath(target) || !sectionPreviewPaths(definition).includes(target)) return null;
  if (validateSectionRevision(definition, { ...definition.defaults, ...draft.content }, isIconName)) return null;
  // One saved section is previewed against the live page, so unrelated pending
  // drafts cannot silently change what this publish action would produce.
  const live = await getPagesContent("home", "about", "fees", "police-station", "services", "shared", ...(target === "/" ? [] : [target.slice(1)]));
  const groups = applySectionDrafts(live, [draft], target);
  if (target === "/") {
    const hero = { ...heroDefaults, ...groups.home?.hero };
    const url = hero.portrait === "/Profile 7.png" ? "/john-violaris-portrait.webp" : hero.portrait;
    const asset = await getMediaAssetForUrl(url);
    if (asset) {
      const image = mediaPresentation(asset);
      groups.home.hero = { ...hero, portraitAlt: image.alt, portraitTitle: image.title ?? "", portraitCaption: image.caption ?? "", portraitCaptionFormat: image.captionFormat };
    }
  }
  return { draft, groups, path: target, historical };
}
