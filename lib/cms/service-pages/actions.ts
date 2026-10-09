"use server";

import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth";
import {
  formError,
  formFailure,
  readCheckbox,
  readFields,
  validateFields,
  type CmsFormState,
} from "@/lib/cms/form";
import { revalidateFor } from "@/lib/cms/revalidate";
import {
  emptyServicePageValues,
  requiredToPublish,
  requiredWithoutSections,
  servicePageContentFrom,
  servicePageFields,
  servicePageItemFields,
  servicePageRules,
  type ServicePageField,
  type ServicePageItemField,
} from "@/lib/cms/service-pages/schema";
import type { SectionItem } from "@/lib/cms/sections/schema";
import { readItems } from "@/lib/cms/sections/values";
import type { ServiceContent, ServicePageContent } from "@/lib/cms/types";
import { cmsWrite } from "@/lib/cms/write";
import { createClient } from "@/utils/supabase/server";
import { getPublicationSeoWarnings } from "@/lib/cms/seo/publication-check";
import { serviceSeoDefaults } from "@/lib/cms/seo/routes";
import type { PublicationMutationResult } from "@/lib/cms/seo/publication-result";
import { readFaqItems, validateFaqItems } from "@/lib/cms/faq";

/**
 * Offence-page mutations.
 *
 * A page belongs to exactly one service — `service_pages.service_id` is
 * unique — so a page is addressed by its service throughout. Saving is an
 * upsert on that column: the first save of a service that has no page yet
 * creates one, and every later save updates it, with no round trip to find out
 * which.
 *
 * The page's own URL is the only public route it appears on, beyond the
 * services index `revalidate.ts` already lists, so each write passes it.
 */

type Owner = { slug: string; name: string; content: Pick<ServiceContent, "href"> };

function pagePath(slug: string): string {
  return `/services/${slug}`;
}

/**
 * What a published page cannot be without, or null when it is complete.
 *
 * Shared by the editor's save and the list's publish button, so a draft
 * cannot be published half-written from the list when the editor would have
 * refused it.
 */
function missingToPublish(
  content: Partial<ServicePageContent>,
): Partial<Record<ServicePageField, string>> | null {
  const missing: Partial<Record<ServicePageField, string>> = {};
  const faqs = validateFaqItems(content.faqItems);
  if (!faqs.ok) missing.faqItems = faqs.error;

  // A long-form page is laid out from its sections; one without them needs
  // the shorter template's eyebrow, introduction and points instead.
  const longForm = Boolean(content.sections?.length);

  for (const field of longForm ? requiredToPublish : [...requiredToPublish, ...requiredWithoutSections]) {
    if (!content[field]) {
      missing[field] = `${servicePageRules[field].label} is needed before the page can be published.`;
    }
  }

  if (!content.penalties?.length) {
    missing.penalties =
      "A published page needs at least one at-a-glance card.";
  }

  if (!longForm && !content.defenceIssues?.length) {
    missing.defenceIssues =
      "A published page needs at least one point in this list, or long-form sections.";
  }

  return Object.keys(missing).length > 0 ? missing : null;
}

/** A path on this site — `/services/speeding` — rather than another site or a script. */
function isSitePath(href: string): boolean {
  return /^\/(?!\/)[^\s]*$/.test(href);
}

export async function saveServicePage(
  _previous: CmsFormState<ServicePageField>,
  formData: FormData,
): Promise<CmsFormState<ServicePageField>> {
  await requireAdmin();

  const submitted = {
    ...emptyServicePageValues,
    ...readFields(formData, servicePageFields),
  };
  const published = readCheckbox(formData, "published");

  const id = formData.get("serviceId");
  const serviceId = typeof id === "string" ? id : "";

  const supabase = await createClient();

  const { data: service } = await supabase
    .from("services")
    .select("slug, name, content")
    .eq("id", serviceId)
    .maybeSingle<Owner>();

  if (!service) {
    return formFailure(
      submitted,
      "This service no longer exists — it may have been deleted in another tab.",
    );
  }

  // The list never offers this, but a Server Action is a public endpoint.
  if (service.content.href) {
    return formFailure(
      submitted,
      "This service links to a page of its own, which is edited under Website content.",
    );
  }

  const validation = validateFields(
    readFields(formData, servicePageFields),
    servicePageRules,
  );

  const fieldErrors: Partial<Record<ServicePageField, string>> = validation.ok
    ? {}
    : { ...validation.fieldErrors };

  const items = {} as Record<ServicePageItemField, SectionItem[]>;

  for (const field of servicePageItemFields) {
    const key = field.key as ServicePageItemField;
    const result = readItems(field, formData);

    items[key] = result.items;

    if (result.error) fieldErrors[key] = result.error;
  }

  const offSite = items.relatedLinks.findIndex(
    (link) => !isSitePath(String(link.href ?? "")),
  );

  if (offSite !== -1 && !fieldErrors.relatedLinks) {
    fieldErrors.relatedLinks = `Link ${offSite + 1} needs an address on this site, starting with “/”, e.g. /services/speeding.`;
  }

  if (!validation.ok || Object.keys(fieldErrors).length > 0) {
    return formError(submitted, fieldErrors);
  }

  const values = { ...submitted, ...validation.values };

  // `process` is stored but not edited here — see the schema — so the save
  // carries over whatever the page already holds.
  const { data: existing, error: existingError } = await supabase
    .from("service_pages")
    .select("content")
    .eq("service_id", serviceId)
    .maybeSingle<{ content: Partial<ServicePageContent> }>();
  if (existingError) return formFailure(values, "The current page could not be loaded. Reload before saving.");
  const faqs = readFaqItems(formData, existing?.content.faqItems);
  if (!faqs.ok) return formError(values, { faqItems: faqs.error });

  const content = servicePageContentFrom(values, items, {
    process: existing?.content.process,
    faqItems: faqs.items,
  });

  // A draft may be incomplete — that is what a draft is for. A published page
  // may not: it would render headings with nothing under them.
  const missing = published ? missingToPublish(content) : null;

  if (missing) {
    return formError(
      values,
      missing,
      "The page needs a few more things before it can be published. Untick Published to save it as a draft.",
    );
  }

  const state = await cmsWrite({
    entity: "service-pages",
    values,
    successMessage: published ? "Page saved and published." : "Draft saved.",
    paths: [pagePath(service.slug)],
    run: async (client) =>
      client
        .from("service_pages")
        .upsert(
          { service_id: serviceId, published, content },
          { onConflict: "service_id" },
        )
        .select("id")
        .maybeSingle(),
  });
  const warnings = state.status === "success" && published
    ? await getPublicationSeoWarnings(pagePath(service.slug), serviceSeoDefaults(pagePath(service.slug), service.name, content.intro), content)
    : [];
  return {
    status: state.status,
    message: warnings.length ? `${state.message} SEO suggestions: ${warnings.join(" ")}` : state.message,
    fieldErrors: state.fieldErrors,
    values: state.values,
  };
}

/**
 * Publish or unpublish from the list.
 *
 * Publishing checks the stored page the way the editor's save does, and
 * refuses an incomplete one. The list's button then settles back to Draft,
 * and the editor is where the reason is shown.
 */
export async function setServicePagePublished(id: string, published: boolean): Promise<PublicationMutationResult> {
  await requireAdmin();

  if (typeof id !== "string" || typeof published !== "boolean") return { ok: false, error: "This page could not be identified. Reload before changing publication." };

  const supabase = await createClient();

  const { data: page } = await supabase
    .from("service_pages")
    .select("content, services!inner(slug,name)")
    .eq("id", id)
    .maybeSingle<{
      content: Partial<ServicePageContent>;
      services: { slug: string; name: string };
    }>();

  if (!page) return { ok: false, error: "The saved page could not be loaded. Reload before publishing." };

  if (published && missingToPublish(page.content)) return { ok: false, error: "This page needs more content before publication. Open its editor to see what is missing." };

  const { error } = await supabase
    .from("service_pages")
    .update({ published })
    .eq("id", id);

  if (error) {
    console.error(`[cms] Failed to change publish state of service page ${id}`, error);

    return { ok: false, error: "The page publication state could not be saved." };
  }

  revalidateFor("service-pages", [pagePath(page.services.slug)]);
  const warnings = published ? await getPublicationSeoWarnings(pagePath(page.services.slug), serviceSeoDefaults(pagePath(page.services.slug), page.services.name, page.content.intro), page.content) : [];
  return { ok: true, warnings };
}

/**
 * Delete an offence page, keeping its service.
 *
 * Addressed by the service, as everything here is. The service stays in the
 * menu and at its address, which goes back to the general copy about how John
 * can help — the same as a service whose page was never written. Its SEO
 * override stays too, because the address it belongs to is still there.
 */
export async function deleteServicePage(formData: FormData) {
  await requireAdmin();

  const id = formData.get("serviceId");

  if (typeof id !== "string") return;

  const supabase = await createClient();

  const { data: service } = await supabase
    .from("services")
    .select("slug")
    .eq("id", id)
    .maybeSingle<{ slug: string }>();

  const { error } = await supabase
    .from("service_pages")
    .delete()
    .eq("service_id", id);

  if (error) {
    console.error(`[cms] Failed to delete the page of service ${id}`, error);

    return;
  }

  revalidateFor("service-pages", service ? [pagePath(service.slug)] : []);
  redirect("/admin/service-pages");
}
