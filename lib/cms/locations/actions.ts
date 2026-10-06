"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { formError, formFailure, readCheckbox, readFields } from "@/lib/cms/form";
import { getLocationPageAdmin, listLocationPagesAdmin } from "@/lib/cms/locations/admin-queries";
import { duplicateLocationContext, locationContentFrom, locationFields, validateLocation, type LocationField, type LocationFormState } from "@/lib/cms/locations/schema";
import { getServices } from "@/lib/cms/queries";
import { dropSeoOverride, moveSeoOverride } from "@/lib/cms/seo/overrides";
import { cmsWrite } from "@/lib/cms/write";
import { parseLondonDateTime, publicationStatus } from "@/lib/cms/publication";
import { hasConfirmedSlugChange } from "@/lib/cms/slug-confirmation";
import { getPublicationSeoWarnings } from "@/lib/cms/seo/publication-check";
import { readLocationStructuredContent } from "@/lib/cms/locations/structured";

function readId(formData: FormData): string | null {
  const value = formData.get("id");
  return typeof value === "string" && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value) ? value : null;
}

export async function saveLocationPage(_previous: LocationFormState, formData: FormData): Promise<LocationFormState> {
  const session = await requireAdmin();
  const values = readFields(formData, locationFields);
  const id = readId(formData);
  if (formData.get("id") && !id) return formFailure(values, "That location ID is invalid. Reload the editor.");
  const [previous, services] = await Promise.all([id ? getLocationPageAdmin(id) : null, getServices()]);
  if (id && !previous) return formFailure(values, "That draft could not be read. Check the database migration and reload.");
  const published = readCheckbox(formData, "published");
  const reviewed = readCheckbox(formData, "legalReviewed");
  const optional = readLocationStructuredContent(formData, previous?.content);
  if (!optional.ok) return formError<LocationField>(values, optional.errors);
  values.parentService = optional.content.parentService;
  values.relatedLocations = optional.content.relatedLocations.join("\n");
  values.localContextRich = optional.content.localContextRich ?? "";
  const peerList = published || optional.content.relatedLocations.length ? await listLocationPagesAdmin() : { available: true, rows: [] };
  if (!peerList.available) return formFailure(values, "The other location drafts could not be checked. Reload before saving relationships or publishing.");
  const relationTargets = published ? peerList.rows.filter((peer) => publicationStatus({ published: peer.published, published_at: peer.published_at ?? null, unpublish_at: peer.unpublish_at ?? null }) === "live" && peer.reviewed_at) : peerList.rows;
  const errors = validateLocation(values, published, reviewed, new Set(services.map((service) => service.href)), new Set(relationTargets.map((peer) => `/locations/${peer.slug}`)), optional.content);
  if (previous && !hasConfirmedSlugChange(previous.slug, values.slug, previous.published, formData.get("confirmSlugChange"))) errors.slug = "Confirm both URLs before changing this published address. Reload if another editor has changed it.";
  const start = parseLondonDateTime(values.publishedAt); const end = parseLondonDateTime(values.unpublishAt);
  if (!start.ok) errors.publishedAt = start.error;
  if (!end.ok) errors.unpublishAt = end.error;
  const publishedAt = start.ok ? start.value ?? (published ? new Date().toISOString() : null) : null;
  const unpublishAt = end.ok ? end.value : null;
  if (publishedAt && unpublishAt && unpublishAt <= publishedAt) errors.unpublishAt = "Unpublishing must be after publication.";
  if (published) {
    const peers = peerList.rows.filter((peer) => peer.published && peer.slug !== previous?.slug);
    const duplicate = duplicateLocationContext(values, peers, optional.content);
    if (duplicate) errors[optional.content.localContextRich ? "localContextRich" : "localContext"] = `Local context is substantially the same as /locations/${duplicate}. Add useful, verifiable content specific to this area before publishing.`;
  }
  if (Object.keys(errors).length > 0) return formError(values, errors);
  const row = {
    slug: values.slug, location: values.location, title: values.title,
    published, content: locationContentFrom(values, optional.content, previous?.content),
    published_at: publishedAt, unpublish_at: unpublishAt,
    reviewed_by: published && reviewed ? session.userId : null,
    reviewed_at: published && reviewed ? new Date().toISOString() : null,
  };
  const paths = [`/locations/${values.slug}`];
  if (previous && previous.slug !== values.slug) paths.push(`/locations/${previous.slug}`);
  const result = await cmsWrite<LocationField, { id: string } | null>({
    entity: "location-pages", values, paths,
    successMessage: publicationStatus(row) === "scheduled" ? "Reviewed location page scheduled in Europe/London time." : published ? "Reviewed location page saved." : "Location draft saved. It is not visible to visitors or search engines.",
    run: async (supabase) => id
      ? supabase.from("location_pages").update(row).eq("id", id).select("id").single()
      : supabase.from("location_pages").insert(row).select("id").single(),
  });
  if (result.status === "success" && previous && previous.slug !== values.slug) await moveSeoOverride(`/locations/${previous.slug}`, `/locations/${values.slug}`);
  if (result.status === "success" && id) revalidatePath(`/admin/location-pages/${id}`);
  const warnings = result.status === "success" && published ? await getPublicationSeoWarnings(`/locations/${values.slug}`, { title: values.title, description: values.description }, row.content) : [];
  if (result.status === "success" && !id && result.data?.id) redirect(`/admin/location-pages/${result.data.id}`);
  return { status: result.status, message: warnings.length ? `${result.message} SEO advisories: ${warnings.join(" ")}` : result.message, fieldErrors: result.fieldErrors, values: result.values };
}

export async function deleteLocationPage(_previous: { message: string | null }, formData: FormData): Promise<{ message: string | null }> {
  await requireAdmin();
  const id = readId(formData);
  if (!id) return { message: "Reload this draft before deleting it." };
  const previous = await getLocationPageAdmin(id);
  if (!previous) return { message: "The draft could not be read. Reload the list." };
  const result = await cmsWrite({
    entity: "location-pages", values: { id }, paths: [`/locations/${previous.slug}`], successMessage: "Location page deleted.",
    run: async (supabase) => supabase.from("location_pages").delete().eq("id", id).select("id").single(),
  });
  if (result.status === "success") { await dropSeoOverride(`/locations/${previous.slug}`); redirect("/admin/location-pages"); }
  return { message: result.message };
}
