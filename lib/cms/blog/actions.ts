"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { isIconName } from "@/components/ui/icons";
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
import { dropSeoOverride, moveSeoOverride } from "@/lib/cms/seo/overrides";
import { cmsWrite } from "@/lib/cms/write";
import {
  blogCategoryFields,
  blogCategoryRules,
  blogPostFields,
  blogPostRules,
  emptyBlogCategoryValues,
  estimateReadTime,
  readSections,
  validateSections,
  type BlogCategoryField,
  type BlogPostField,
  type BlogPostFormState,
} from "@/lib/cms/blog/schema";
import type { BlogPostContent } from "@/lib/cms/types";
import { parseLondonDateTime, publicationStatus } from "@/lib/cms/publication";
import { hasConfirmedSlugChange } from "@/lib/cms/slug-confirmation";
import { createClient } from "@/utils/supabase/server";
import { getMediaAssetForUrl } from "@/lib/cms/media/queries";
import { mediaPresentation } from "@/lib/cms/media/schema";
import { uploadMediaImage } from "@/lib/cms/media/actions";
import { getPublicationSeoWarnings } from "@/lib/cms/seo/publication-check";
import { articleSeoDefaults } from "@/lib/cms/seo/routes";
import { readFaqItems, validateFaqItems } from "@/lib/cms/faq";

/**
 * Blog mutations.
 *
 * Everything here runs through `cmsWrite`, which confirms the caller is an
 * admin, runs the statement under the caller's own RLS, rebuilds the affected
 * routes and hands back a form state. What is left in each action is its field
 * list and its query — which is the whole point of the wrapper.
 */

/** The public URL of an article, for revalidation. */
function articlePath(slug: string): string {
  return `/blog/${slug}`;
}

/**
 * Create or update an article.
 *
 * A create redirects to the new post's editor so the next save is an update
 * rather than a second insert. `redirect()` throws to unwind, so it is called
 * after `cmsWrite` has returned rather than inside it.
 */
export async function saveBlogPost(
  _previous: BlogPostFormState,
  formData: FormData,
): Promise<BlogPostFormState> {
  await requireAdmin();

  const id = formData.get("id");
  const postId = typeof id === "string" && id ? id : null;

  const submitted = readFields(formData, blogPostFields);
  const published = readCheckbox(formData, "published");
  const sections = readSections(formData);

  const validation = validateFields(submitted, blogPostRules);
  const sectionErrors = validateSections(sections);

  if (!validation.ok || Object.keys(sectionErrors).length > 0) {
    return {
      ...formError(
        submitted,
        validation.ok ? {} : validation.fieldErrors,
        "Some details need checking before this can be saved.",
      ),
      sectionErrors,
    };
  }

  const values = validation.values;
  let existing: { slug: string; published: boolean; content: BlogPostContent } | null = null;
  if (postId) {
    const supabase = await createClient();
    const { data, error } = await supabase.from("blog_posts").select("slug,published,content")
      .eq("id", postId).maybeSingle<{ slug: string; published: boolean; content: BlogPostContent }>();
    if (error || !data) return { ...formFailure(values, "This article could not be loaded. Reload before saving."), sectionErrors: {} };
    existing = data;
    if (!hasConfirmedSlugChange(data.slug, values.slug, data.published, formData.get("confirmSlugChange"))) {
      return { ...formError(values, { slug: "Confirm the URL change before saving. If this article changed in another tab, reload first." }), sectionErrors: {} };
    }
  }
  const faqs = readFaqItems(formData, existing?.content.faqItems);
  if (!faqs.ok) return { ...formFailure(values, "Check the optional FAQs before saving."), sectionErrors: {}, faqError: faqs.error };
  const fieldErrors: Partial<Record<BlogPostField, string>> = {};
  const start = parseLondonDateTime(values.publishedAt);
  const end = parseLondonDateTime(values.unpublishAt);
  if (!start.ok) fieldErrors.publishedAt = start.error;
  if (!end.ok) fieldErrors.unpublishAt = end.error;
  const publishedAt = start.ok
    ? start.value ?? (published ? new Date().toISOString() : null)
    : null;
  const unpublishAt = end.ok ? end.value : null;
  if (unpublishAt && publishedAt && unpublishAt <= publishedAt) {
    fieldErrors.unpublishAt = "Unpublishing must be after publication.";
  }

  // Checks a per-field rule cannot express, because they depend on each other.
  if (!isIconName(values.icon)) {
    fieldErrors.icon = "Choose an icon from the list.";
  }

  const libraryImage = values.featuredImage ? await getMediaAssetForUrl(values.featuredImage) : null;
  if (values.featuredImage && !values.featuredImageAlt && !libraryImage) {
    fieldErrors.featuredImageAlt =
      "Describe the image for anyone who cannot see it. An image with no description is invisible to a screen reader.";
  }

  // A draft may be empty — that is what a draft is for. A published article
  // may not: it would be a headline with nothing underneath it.
  if (published && sections.length === 0) {
    fieldErrors.excerpt =
      "An article needs at least one section before it can be published.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ...formError(values, fieldErrors), sectionErrors: {} };
  }

  const content: BlogPostContent = {
    excerpt: values.excerpt,
    standfirst: values.standfirst,
    readTime: values.readTime || estimateReadTime(sections),
    icon: values.icon,
    body: sections,
    ...(faqs.items.length ? { faqItems: faqs.items } : {}),
    ...(values.relatedService ? { relatedService: values.relatedService } : {}),
    ...(values.featuredImage ? { featuredImage: values.featuredImage } : {}),
    ...(values.featuredImageAlt
      ? { featuredImageAlt: values.featuredImageAlt }
      : {}),
    ...(values.featuredImage && values.featuredImageTitle
      ? { featuredImageTitle: values.featuredImageTitle } : {}),
    ...(values.featuredImage && values.featuredImageCaption
      ? { featuredImageCaption: values.featuredImageCaption } : {}),
  };
  if (libraryImage) {
    const image = mediaPresentation(libraryImage);
    content.featuredImageAlt = image.alt;
    content.featuredImageTitle = image.title;
    content.featuredImageCaption = image.caption;
    content.featuredImageCaptionFormat = image.captionFormat;
  }

  const row = {
    slug: values.slug,
    title: values.title,
    category_id: values.categoryId || null,
    published,
    published_at: publishedAt,
    unpublish_at: unpublishAt,
    content,
  };

  // The slug may have changed, so the old URL needs rebuilding too or it stays
  // cached and serving under a name nothing points at any more.
  const paths = [articlePath(values.slug)];
  const renamedFrom =
    existing && existing.slug !== values.slug
      ? existing.slug
      : null;

  if (renamedFrom) {
    paths.push(articlePath(renamedFrom));
  }

  const state = await cmsWrite<BlogPostField, { id: string } | null>({
    entity: "blog-posts",
    values,
    successMessage: publicationStatus(row) === "scheduled"
      ? "Article saved. Publication is scheduled in UK local time."
      : publicationStatus(row) === "expired"
        ? "Article saved. Its publication window has ended."
        : published ? "Article saved and published." : "Draft saved.",
    paths,
    run: async (supabase) =>
      postId
        ? supabase.from("blog_posts").update(row).eq("id", postId).select("id").maybeSingle()
        : supabase.from("blog_posts").insert(row).select("id").maybeSingle(),
  });
  const warnings = state.status === "success" && published ? await getPublicationSeoWarnings(articlePath(values.slug), articleSeoDefaults(values.slug, values.title, values.excerpt, values.featuredImage, values.featuredImageAlt, publishedAt), content, { publishedAt: publishedAt ?? undefined }) : [];

  // The article's SEO override follows it to its new address.
  if (state.status === "success" && postId && renamedFrom) {
    await moveSeoOverride(articlePath(renamedFrom), articlePath(values.slug));
  }
  if (state.status === "success" && postId) revalidatePath(`/admin/blog-posts/${postId}`);

  if (state.status === "success" && !postId && state.data?.id) {
    // Straight into the editor for the article that now exists, so the next
    // save updates it rather than inserting a second one. This is why `run`
    // selects the id back.
    redirect(`/admin/blog-posts/${state.data.id}`);
  }

  // Rebuilt field by field rather than spread: `data` stays on the server, and
  // the editor gets the form state and nothing else.
  return {
    status: state.status,
    message: warnings.length ? `${state.message} SEO advisories: ${warnings.join(" ")}` : state.message,
    fieldErrors: state.fieldErrors,
    values: state.values,
    sectionErrors: {},
  };
}

/**
 * Publish or unpublish from the list, without opening the article.
 *
 * Called inside a transition rather than as a form action, so the row can paint
 * the new state optimistically. Arguments are still treated as untrusted: a
 * Server Action is a public POST endpoint whatever calls it.
 */
export async function setBlogPostPublished(id: string, published: boolean) {
  await requireAdmin();

  if (typeof id !== "string" || typeof published !== "boolean") return { ok: false, error: "Reload this article before publishing." };

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("blog_posts")
    .select("slug,title,content,published_at")
    .eq("id", id)
    .maybeSingle<{ slug: string; title: string; content: BlogPostContent; published_at: string | null }>();

  if (!existing) return { ok: false, error: "This article could not be loaded." };
  const faqs = validateFaqItems(existing.content.faqItems);
  if (published && !faqs.ok) return { ok: false, error: `Check this article's optional FAQs before publishing. ${faqs.error}` };
  if (published && (!Array.isArray(existing.content.body) || existing.content.body.length === 0)) return { ok: false, error: "Add at least one article section before publishing." };
  if (published && existing.content.featuredImage && !existing.content.featuredImageAlt && !(await getMediaAssetForUrl(existing.content.featuredImage))) return { ok: false, error: "Add an image description before publishing this article." };

  const { error } = await supabase
    .from("blog_posts")
    .update({
      published,
      // First publish dates the article; unpublishing keeps the date, so
      // republishing later does not silently present it as brand new.
      published_at:
        published && !existing.published_at
          ? new Date().toISOString()
          : existing.published_at,
    })
    .eq("id", id);

  if (error) {
    console.error(`[cms] Failed to change publish state of post ${id}`, error);

    return { ok: false, error: "The publication state could not be saved." };
  }

  revalidateFor("blog-posts", [articlePath(existing.slug)]);
  const warnings = published ? await getPublicationSeoWarnings(articlePath(existing.slug), articleSeoDefaults(existing.slug, existing.title, existing.content.excerpt, existing.content.featuredImage, existing.content.featuredImageAlt, existing.published_at), existing.content, { publishedAt: existing.published_at }) : [];
  return { ok: true, warnings };
}

export async function deleteBlogPost(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id");

  if (typeof id !== "string") return;

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("blog_posts")
    .select("slug")
    .eq("id", id)
    .maybeSingle<{ slug: string }>();

  const { error } = await supabase.from("blog_posts").delete().eq("id", id);

  if (error) {
    console.error(`[cms] Failed to delete post ${id}`, error);

    return;
  }

  if (existing) await dropSeoOverride(articlePath(existing.slug));

  revalidateFor("blog-posts", existing ? [articlePath(existing.slug)] : []);
  redirect("/admin/blog-posts");
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function saveBlogCategory(
  _previous: CmsFormState<BlogCategoryField>,
  formData: FormData,
): Promise<CmsFormState<BlogCategoryField>> {
  await requireAdmin();

  const id = formData.get("id");
  const categoryId = typeof id === "string" && id ? id : null;

  const submitted = readFields(formData, blogCategoryFields);
  const validation = validateFields(submitted, blogCategoryRules);

  if (!validation.ok) {
    return formError(submitted, validation.fieldErrors);
  }

  const values = validation.values;
  const row = { name: values.name, slug: values.slug };

  return cmsWrite<BlogCategoryField>({
    entity: "blog-categories",
    values: categoryId ? values : emptyBlogCategoryValues,
    successMessage: categoryId ? "Category renamed." : "Category added.",
    run: async (supabase) =>
      categoryId
        ? supabase.from("blog_categories").update(row).eq("id", categoryId).select()
        : supabase.from("blog_categories").insert(row).select(),
  });
}

/**
 * Delete a category.
 *
 * `on delete set null` on `blog_posts.category_id` means posts survive and fall
 * back to the default label rather than disappearing with the category. The
 * admin list shows the count beforehand so that is a decision, not a surprise.
 */
export async function deleteBlogCategory(formData: FormData) {
  await requireAdmin();

  const id = formData.get("id");

  if (typeof id !== "string") return;

  const supabase = await createClient();

  const { error } = await supabase.from("blog_categories").delete().eq("id", id);

  if (error) {
    console.error(`[cms] Failed to delete category ${id}`, error);

    return;
  }

  // Posts that referenced it now render the default label, so the index and
  // every article page are both stale.
  revalidateFor("blog-categories");
  revalidateFor("blog-posts");
}

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

export type ImageUploadResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * Upload a featured image and return its public URL.
 *
 * The bucket enforces the same size and type limits, but they are checked here
 * first so a rejection is a sentence John can read rather than a storage error
 * code, and so nothing is sent over the wire that is going to be refused.
 *
 * Filenames use a sanitized descriptive stem and a random suffix. Folder,
 * extension and allowed characters are controlled here, so the original name
 * cannot escape its storage folder or silently overwrite an existing image.
 */
export async function uploadBlogImage(
  formData: FormData,
): Promise<ImageUploadResult> {
  return uploadMediaImage(formData);
}
