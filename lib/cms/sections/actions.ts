"use server";

import { revalidatePath } from "next/cache";
import { createAuthorizedAdminClient } from "@/lib/auth";
import { getPublicationSeoWarnings } from "@/lib/cms/seo/publication-check";
import { listSeoRoutes } from "@/lib/cms/seo/routes";
import { describeDatabaseError, formError, formFailure, isAddress } from "@/lib/cms/form";
import { revalidateFor, type RevalidateTarget } from "@/lib/cms/revalidate";
import { fieldName, findSection, type SectionContent, type SectionDefinition, type SectionFormState } from "@/lib/cms/sections/schema";
import { isEmptyValue, parseField, readItems, sectionValuesFrom } from "@/lib/cms/sections/values";
import { readSectionWorkflow, type SectionDraft } from "@/lib/cms/sections/drafts";

/** All modes are explicit and use one stale-safe, administrator-only transaction. */
export async function savePageSection(_previous: SectionFormState, formData: FormData): Promise<SectionFormState> {
  const client = await createAuthorizedAdminClient();
  const failed = (values: Record<string, string>, message: string): SectionFormState => ({ ...formFailure(values, message), savedDraft: _previous.savedDraft, savedLiveContent: _previous.savedLiveContent });
  const page = readString(formData, "page");
  const key = readString(formData, "section");
  const definition = findSection(page, key);
  if (!definition) return failed({}, "That section is not one this site has. Reload the page and try again.");
  const submitted = readSubmittedValues(definition, formData);
  const workflow = readSectionWorkflow(formData);
  if (!workflow.ok) return failed(submitted, workflow.error);
  const content: SectionContent = {};
  const fieldErrors: Record<string, string> = {};
  if (workflow.intent === "draft" || workflow.intent === "publish") {
    for (const field of definition.fields) {
      if (field.kind === "items") {
        const { items, error } = readItems(field, formData);

        if (error) fieldErrors[field.key] = error;

        content[field.key] = items;

        continue;
      }

      const value = parseField(field, submitted[field.key] ?? "");

      if (field.required && isEmptyValue(value)) {
        fieldErrors[field.key] = `${field.label} cannot be empty.`;
      } else if (
        field.kind === "image" &&
        typeof value === "string" &&
        value &&
        !isAddress(value)
      ) {
        fieldErrors[field.key] = "Upload the image again — that address cannot be used.";
      }

      content[field.key] = value;
    }

    if (Object.keys(fieldErrors).length > 0) {
      return { ...formError(submitted, fieldErrors), savedDraft: _previous.savedDraft, savedLiveContent: _previous.savedLiveContent };
    }
  }

  const { data, error } = await client.rpc("save_page_section_content", {
    p_page: page, p_section: key, p_content: content, p_intent: workflow.intent,
    p_expected_live_content: workflow.expectedLiveContent,
    p_expected_draft_id: workflow.expectedDraftId,
    p_expected_draft_version: workflow.expectedDraftVersion,
  });
  if (error || !data) return failed(submitted,
    error && ["PGRST202", "42P01"].includes(error.code)
      ? "The private draft workflow is unavailable. Install the reviewed static-draft migration, then reload before saving."
      : error ? describeDatabaseError(error) : "The save could not be confirmed. Reload and review the saved version before retrying.");
  const saved = data as { draft: SectionDraft | null; live_content: SectionContent | null };
  let values = submitted;
  let reset = false;
  let message = `${definition.label} saved as a private draft. Preview it before publishing.`;
  if (workflow.intent === "publish") message = `${definition.label} published. The previous live values remain in history.`;
  if (workflow.intent === "discard") {
    values = sectionValuesFrom(definition, { ...definition.defaults, ...(saved.live_content ?? {}) });
    reset = true;
    message = "Private draft discarded. The live section has not been changed.";
  }
  if (workflow.intent === "reset") {
    values = sectionValuesFrom(definition, definition.defaults);
    reset = true;
    message = `${definition.label} now uses its original live wording. Previous values remain in history.`;
  }
  if (workflow.intent === "publish" || workflow.intent === "reset") {
    revalidateFor("page-sections", routesFor(definition));
    try {
      const affected = (await listSeoRoutes()).filter((route) => definition.appearsOn.includes("*") || definition.appearsOn.includes(route.path));
      const warnings = [...new Set((await Promise.all(affected.map((route) => getPublicationSeoWarnings(route.path, route.defaults, workflow.intent === "reset" ? definition.defaults : content)))).flat())];
      if (warnings.length) message += ` SEO advisories: ${warnings.join(" ")}`;
    } catch {
      message += " Publication succeeded. SEO advisories are temporarily unavailable; review the SEO dashboard when it is available.";
    }
  }
  revalidatePath(`/admin/website-content/${page}`);
  return {
    status: "success", message, fieldErrors: {}, values, reset,
    savedDraft: saved.draft ? { id: saved.draft.id, version: saved.draft.version, base_content: saved.draft.base_content } : null,
    savedLiveContent: saved.live_content,
  };
}

// ---------------------------------------------------------------------------

function readString(formData: FormData, name: string): string {
  const value = formData.get(name);

  return typeof value === "string" ? value : "";
}

/**
 * The scalar fields as submitted, before parsing.
 *
 * Echoed back on a rejection so the editor keeps what was typed, which is why
 * these are the raw textarea strings rather than the parsed arrays — putting a
 * parsed value back in a textarea would silently reformat someone's draft while
 * telling them to fix something else.
 */
function readSubmittedValues(
  definition: SectionDefinition,
  formData: FormData,
): Record<string, string> {
  const values = sectionValuesFrom(definition, {});

  for (const field of definition.fields) {
    if (field.kind === "items") continue;

    values[field.key] = readString(formData, fieldName(field.key));
  }

  return values;
}

/**
 * The public routes a section change affects.
 *
 * `"*"` is the closing call to action, which is in the body of every page. It
 * becomes a layout revalidation of the root, the same sweep `site-settings`
 * uses, because naming twenty-odd routes by hand is a list that would be wrong
 * the next time one is added.
 */
function routesFor(definition: SectionDefinition): RevalidateTarget[] {
  return definition.appearsOn.includes("*")
    ? [{ path: "/", type: "layout" }]
    : definition.appearsOn;
}
