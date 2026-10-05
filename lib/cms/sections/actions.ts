"use server";

import { requireAdmin } from "@/lib/auth";
import { getPublicationSeoWarnings } from "@/lib/cms/seo/publication-check";
import { listSeoRoutes } from "@/lib/cms/seo/routes";
import { formError, isAddress } from "@/lib/cms/form";
import { type RevalidateTarget } from "@/lib/cms/revalidate";
import {
  fieldName,
  findSection,
  type SectionContent,
  type SectionDefinition,
  type SectionFormState,
} from "@/lib/cms/sections/schema";
import {
  isEmptyValue,
  parseField,
  readItems,
  sectionValuesFrom,
} from "@/lib/cms/sections/values";
import { cmsWrite } from "@/lib/cms/write";

/**
 * Saving a page section.
 *
 * One action for every section on the site rather than one per section: a
 * section is its field list, and the field list is data in
 * `lib/cms/sections/schema.ts`. What arrives in the `FormData` is decided by
 * the same registry the editor rendered from, so a field added there is
 * editable and saved without a line of code here changing.
 *
 * `page` and `section` come from the submission and are looked up in the
 * registry before anything else happens. A Server Action is a public POST
 * endpoint, so a pair that is not in the registry is refused rather than
 * written — that check is what stops arbitrary rows being inserted into the
 * table by a hand-made request.
 */

export async function savePageSection(
  _previous: SectionFormState,
  formData: FormData,
): Promise<SectionFormState> {
  await requireAdmin();

  const page = readString(formData, "page");
  const key = readString(formData, "section");
  const definition = findSection(page, key);

  if (!definition) {
    return {
      status: "error",
      message:
        "That section is not one this site has. Reload the page and try again.",
      fieldErrors: {},
      values: {},
    };
  }

  /*
   * "Revert to original" is this form's second submit button rather than a
   * form of its own, so its answer comes back through the editor's state —
   * which is how the editor knows to put its rows and images back as well as
   * its text. As a separate form it left the editor holding the edits it had
   * just discarded, and the next save restored them.
   *
   * Deleting the row rather than writing the defaults into it: the defaults
   * live in `lib/content/pages.ts` and the read falls back to them when no row
   * exists, so an absent row *is* the default. Writing a copy of them would
   * freeze today's wording into the database and quietly detach the section
   * from the file that defines it.
   */
  if (formData.get("intent") === "reset") {
    const state = await cmsWrite({
      entity: "page-sections",
      values: sectionValuesFrom(definition, definition.defaults),
      successMessage: `${definition.label} is back to its original wording.`,
      paths: routesFor(definition),
      run: async (supabase) =>
        supabase
          .from("page_sections")
          .delete()
          .eq("page", page)
          .eq("section", key)
          .select("section"),
    });

    return {
      status: state.status,
      message: state.message,
      fieldErrors: state.fieldErrors,
      values: state.values,
      reset: state.status === "success",
    };
  }

  const submitted = readSubmittedValues(definition, formData);
  const content: SectionContent = {};
  const fieldErrors: Record<string, string> = {};

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
    return formError(submitted, fieldErrors);
  }

  const state = await cmsWrite({
    entity: "page-sections",
    values: submitted,
    successMessage: `${definition.label} saved.`,
    paths: routesFor(definition),
    // `onConflict` rather than an id: a section is identified by where it is,
    // and the unique constraint on (page, section) is what makes saving an
    // untouched section an insert and saving an edited one an update, with no
    // round trip in between to find out which.
    run: async (supabase) =>
      supabase
        .from("page_sections")
        .upsert({ page, section: key, content }, { onConflict: "page,section" })
        .select("section")
        .maybeSingle(),
  });

  const affected = state.status === "success" ? (await listSeoRoutes()).filter((route) => definition.appearsOn.includes("*") || definition.appearsOn.includes(route.path)) : [];
  const warnings = [...new Set((await Promise.all(affected.map((route) => getPublicationSeoWarnings(route.path, route.defaults, content)))).flat())];
  // Rebuilt field by field rather than spread: `data` stays on the server.
  return {
    status: state.status,
    message: warnings.length ? `${state.message} SEO advisories: ${warnings.join(" ")}` : state.message,
    fieldErrors: state.fieldErrors,
    values: state.values,
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
