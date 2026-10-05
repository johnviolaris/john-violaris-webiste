"use server";

import { revalidatePath } from "next/cache";
import { createAuthorizedAdminClient, createAuthorizedSeoClient, requireAdmin } from "@/lib/auth";
import { describeDatabaseError } from "@/lib/cms/form";
import { revalidateFor } from "@/lib/cms/revalidate";
import { moveSeoOverride } from "@/lib/cms/seo/overrides";
import type { BlogPostRow, ServicePageRow } from "@/lib/cms/types";
import { findSection } from "@/lib/cms/sections/schema";
import { siteSettingKeys } from "@/lib/site-config";
import { practiceSettingKeys, validateSettingRevision, validateSectionRevision } from "@/lib/cms/revisions/validation";
import { practiceFactsErrors } from "@/lib/cms/settings/practice-facts";
import { settingValuesFrom } from "@/lib/cms/settings/schema";
import { validateImageMetadata, type ImageMetadata } from "@/lib/cms/media/schema";
import { validateSeoRevision, validateRobotsRevision } from "@/lib/cms/seo/revision-validation";
import { validateIntegrationsRevision } from "@/lib/cms/seo/integrations";
import { isIconName } from "@/components/ui/icons";
import { validateFaqItems } from "@/lib/cms/faq";

export type RestoreState = { status: "idle" | "error" | "success"; message: string };

export async function restoreContentRevision(_previous: RestoreState, form: FormData): Promise<RestoreState> {
  let supabase = await createAuthorizedSeoClient();
  const revisionId = form.get("revisionId");
  if (typeof revisionId !== "string" || !/^[0-9a-f-]{36}$/i.test(revisionId)) {
    return { status: "error", message: "Choose a saved revision." };
  }
  const { data: revision, error } = await supabase.from("content_revisions")
    .select("entity_table,entity_id,snapshot").eq("id", revisionId)
    .maybeSingle<{ entity_table: string; entity_id: string; snapshot: BlogPostRow | ServicePageRow }>();
  if (error || !revision) return { status: "error", message: "This revision could not be loaded." };

  // Revision SELECT RLS exposes only SEO/robots history to SEO editors. Every
  // other restoration independently requires the stronger administrator role.
  const saved = revision.snapshot as unknown as Record<string, unknown>;
  if (revision.entity_table !== "seo_metadata" && !(revision.entity_table === "site_settings" && saved.key === "robots")) {
    await requireAdmin();
    supabase = await createAuthorizedAdminClient();
  }
  const failure = (message: string): RestoreState => ({ status: "error", message });

  if (revision.entity_table === "blog_posts") {
    const snapshot = revision.snapshot as BlogPostRow;
    const faqs = validateFaqItems(snapshot.content?.faqItems);
    if (!faqs.ok) return failure(`This revision has invalid FAQs. ${faqs.error}`);
    const { data: current } = await supabase.from("blog_posts").select("slug")
      .eq("id", revision.entity_id).maybeSingle<{ slug: string }>();
    if (!current) return { status: "error", message: "The article no longer exists." };
    const { data, error: saveError } = await supabase.from("blog_posts").update({
      slug: snapshot.slug, title: snapshot.title, category_id: snapshot.category_id,
      content: snapshot.content, published: false, published_at: snapshot.published_at,
      unpublish_at: null,
    }).eq("id", revision.entity_id).select("id").maybeSingle();
    if (saveError || !data) return { status: "error", message: saveError ? describeDatabaseError(saveError) : "Nothing was restored." };
    const oldPath = `/blog/${current.slug}`;
    const newPath = `/blog/${snapshot.slug}`;
    if (oldPath !== newPath) await moveSeoOverride(oldPath, newPath);
    revalidateFor("blog-posts", [oldPath, newPath]);
    revalidatePath(`/admin/blog-posts/${revision.entity_id}`);
  } else if (revision.entity_table === "service_pages") {
    const snapshot = revision.snapshot as ServicePageRow;
    const faqs = validateFaqItems(snapshot.content?.faqItems);
    if (!faqs.ok) return failure(`This revision has invalid FAQs. ${faqs.error}`);
    const { data, error: saveError } = await supabase.from("service_pages")
      .update({ content: snapshot.content, published: false }).eq("id", revision.entity_id)
      .select("service_id").maybeSingle<{ service_id: string }>();
    if (saveError || !data) return { status: "error", message: saveError ? describeDatabaseError(saveError) : "The service page no longer exists." };
    const { data: service } = await supabase.from("services").select("slug")
      .eq("id", data.service_id).maybeSingle<{ slug: string }>();
    revalidateFor("service-pages", service ? [`/services/${service.slug}`] : []);
    revalidatePath(`/admin/service-pages/${data.service_id}`);
  } else if (revision.entity_table === "page_sections") {
    if (typeof saved.page !== "string" || typeof saved.section !== "string" || !findSection(saved.page, saved.section)) return failure("This section is no longer editable.");
    const invalid = validateSectionRevision(findSection(saved.page, saved.section)!, saved.content, isIconName);
    if (invalid) return failure(invalid);
    const { error: saveError } = await supabase.from("page_sections").upsert({ page: saved.page, section: saved.section, content: saved.content }, { onConflict: "page,section" });
    if (saveError) return failure(describeDatabaseError(saveError));
    revalidatePath("/", "layout"); revalidatePath("/sitemap.xml"); revalidatePath(`/admin/website-content/${saved.page}`);
  } else if (revision.entity_table === "site_settings") {
    if (typeof saved.key !== "string" || (!["robots", "scripts"].includes(saved.key) && !siteSettingKeys.includes(saved.key as (typeof siteSettingKeys)[number]))) return failure("This setting is no longer editable.");
    if (saved.key === "robots") {
      const checked = await validateRobotsRevision(saved.value, form.get("confirmRestrictions") === "on");
      if (!checked.ok) return failure(checked.error);
      saved.value = checked.value;
    } else if (saved.key === "scripts") {
      const checked = validateIntegrationsRevision(saved.value);
      if (!checked.ok) return failure(checked.error);
      saved.value = checked.value;
    } else {
      const invalid = validateSettingRevision(saved.key, saved.value);
      if (invalid) return failure(invalid);
      if (practiceSettingKeys.includes(saved.key as (typeof practiceSettingKeys)[number])) {
        if (form.get("confirmPracticeFacts") !== "on") return failure("Confirm John has reviewed the practice facts before restoring them.");
        const { data: settings, error: settingsError } = await supabase.from("site_settings").select("key,value");
        if (settingsError) return failure("Current practice details could not be checked.");
        const merged = settingValuesFrom({ ...Object.fromEntries((settings ?? []).map((row) => [row.key, row.value])), [saved.key]: saved.value });
        const errors = practiceFactsErrors(merged);
        if (Object.keys(errors).length) return failure("This change would leave incomplete or invalid practice details. Restore the reviewed details together through Site Settings.");
      }
    }
    const { error: saveError } = await supabase.from("site_settings").upsert({ key: saved.key, value: saved.value }, { onConflict: "key" });
    if (saveError) return failure(describeDatabaseError(saveError));
    revalidateFor("site-settings"); revalidatePath("/robots.txt"); revalidatePath("/admin/seo-metadata");
    if (saved.key === "scripts") revalidatePath("/admin/seo-metadata/integrations");
  } else if (revision.entity_table === "seo_metadata") {
    if (typeof saved.path !== "string" || !saved.path.startsWith("/") || saved.path.startsWith("//")) return failure("This SEO path is invalid.");
    const { data: current } = await supabase.from("seo_metadata").select("path").eq("id", revision.entity_id).maybeSingle<{ path: string }>();
    const path = current?.path ?? saved.path;
    const checked = await validateSeoRevision(path, saved.content);
    if (!checked.ok) return failure(checked.error);
    const { error: saveError } = await supabase.from("seo_metadata").upsert({ path, content: checked.content }, { onConflict: "path" });
    if (saveError) return failure(describeDatabaseError(saveError));
    revalidateFor("seo-metadata", [path]); revalidatePath("/admin/seo-metadata/edit");
  } else if (revision.entity_table === "media_assets") {
    if (typeof saved.alt_text !== "string" || typeof saved.is_decorative !== "boolean" || typeof saved.title !== "string" || typeof saved.caption !== "string") return failure("This image version cannot be read by the current editor.");
    const invalid = validateImageMetadata(saved as unknown as ImageMetadata);
    if (invalid) return failure(invalid);
    const { data, error: saveError } = await supabase.from("media_assets").update({ alt_text: saved.alt_text, is_decorative: saved.is_decorative, title: saved.title, caption: saved.caption, caption_format: saved.caption_format ?? "plain" }).eq("id", revision.entity_id).select("id").maybeSingle();
    if (saveError || !data) return failure("This image could not be restored.");
    revalidatePath("/", "layout"); revalidatePath("/sitemap.xml"); revalidatePath("/admin/media"); revalidatePath(`/admin/media/${revision.entity_id}`);
  } else if (revision.entity_table === "location_pages") {
    const { data, error: saveError } = await supabase.from("location_pages").update({ title: saved.title, location: saved.location, content: saved.content, published: false, published_at: saved.published_at, unpublish_at: null, reviewed_by: null, reviewed_at: null }).eq("id", revision.entity_id).select("slug").maybeSingle<{ slug: string }>();
    if (saveError || !data) return failure("This location draft could not be restored.");
    revalidateFor("location-pages", [`/locations/${data.slug}`]); revalidatePath(`/admin/location-pages/${revision.entity_id}`);
  } else if (revision.entity_table === "services") {
    const { data, error: saveError } = await supabase.from("services").update({ name: saved.name, content: saved.content, sort_order: saved.sort_order, published: false }).eq("id", revision.entity_id).select("slug").maybeSingle<{ slug: string }>();
    if (saveError || !data) return failure("This service draft could not be restored.");
    revalidateFor("services", [`/services/${data.slug}`]); revalidatePath(`/admin/services/${revision.entity_id}`);
  } else if (revision.entity_table === "service_groups") {
    const { data, error: saveError } = await supabase.from("service_groups").update({ name: saved.name, motoring: saved.motoring, sort_order: saved.sort_order }).eq("id", revision.entity_id).select("id").maybeSingle();
    if (saveError || !data) return failure(saveError ? describeDatabaseError(saveError) : "This group no longer exists.");
    revalidateFor("services"); revalidatePath(`/admin/services/groups/${revision.entity_id}`);
  } else if (revision.entity_table === "blog_categories") {
    const { data, error: saveError } = await supabase.from("blog_categories").update({ name: saved.name, slug: saved.slug }).eq("id", revision.entity_id).select("id").maybeSingle();
    if (saveError || !data) return failure(saveError ? describeDatabaseError(saveError) : "This category no longer exists.");
    revalidateFor("blog-categories"); revalidatePath("/blog/[slug]", "page");
  } else {
    return { status: "error", message: "This content type cannot be restored." };
  }
  const asDraft = ["blog_posts", "service_pages", "location_pages", "services"].includes(revision.entity_table);
  return { status: "success", message: asDraft ? "Revision restored as a draft. Review it in the editor, then publish when ready." : "Saved fields restored. The live website will refresh, and the previous values remain in history." };
}
