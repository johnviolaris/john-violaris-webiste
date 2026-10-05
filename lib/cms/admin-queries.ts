import "server-only";

import { cache } from "react";

import type {
  BlogCategoryRow,
  BlogPostRow,
  SeoRow,
  ServiceGroupRow,
  ServicePageRow,
  ServiceRow,
  SiteSettingRow,
  TestimonialRow,
} from "@/lib/cms/types";
import type { SectionContent } from "@/lib/cms/sections/schema";
import { createAuthorizedAdminClient } from "@/lib/auth";

/**
 * Admin-side content reads.
 *
 * Three things separate these from `lib/cms/queries.ts`:
 *
 *  - They go through the cookie-backed client, so the "Admins can manage..."
 *    policies are what authorises them. A non-admin session sees no rows rather
 *    than an error, which is why every page using these also sits behind
 *    `createAuthorizedAdminClient()` also performs the admin check before any
 *    query begins; the layout is only a shared UI guard.
 *  - They return whole rows — id, publish state, sort order — because an
 *    editing form needs the fields a visitor never sees.
 *  - They see drafts. That is the entire point of them.
 *
 * Kept apart from the write actions on purpose: a file marked `"use server"`
 * publishes every export as a callable endpoint, and a read has no business
 * being one.
 *
 * Errors log and return an empty result rather than throwing. A broken query
 * should show John an empty list he can report, not an error page that loses
 * whatever else was on screen.
 */

/** Newest-relevant-first ordering is per entity; this is just the page size. */
const listLimit = 500;

function logFailure(what: string, error: unknown) {
  console.error(`[cms] Failed to load ${what} for the admin`, error);
}

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

export const listServices = cache(async function listServices(): Promise<
  ServiceRow[]
> {
  const supabase = await createAuthorizedAdminClient();

  const { data, error } = await supabase
    .from("services")
    .select("*")
    .order("sort_order", { ascending: true })
    .limit(listLimit)
    .returns<ServiceRow[]>();

  if (error) {
    logFailure("services", error);

    return [];
  }

  return data ?? [];
});

/** Every service group, empty ones included, in menu order. */
export const listServiceGroups = cache(async function listServiceGroups(): Promise<
  ServiceGroupRow[]
> {
  const supabase = await createAuthorizedAdminClient();

  const { data, error } = await supabase
    .from("service_groups")
    .select("*")
    .order("sort_order", { ascending: true })
    .returns<ServiceGroupRow[]>();

  if (error) {
    logFailure("service groups", error);

    return [];
  }

  return data ?? [];
});

export const getServiceGroup = cache(async function getServiceGroup(
  id: string,
): Promise<ServiceGroupRow | null> {
  const supabase = await createAuthorizedAdminClient();

  const { data, error } = await supabase
    .from("service_groups")
    .select("*")
    .eq("id", id)
    .maybeSingle<ServiceGroupRow>();

  if (error) {
    logFailure(`service group ${id}`, error);

    return null;
  }

  return data;
});

export const getService = cache(async function getService(
  id: string,
): Promise<ServiceRow | null> {
  const supabase = await createAuthorizedAdminClient();

  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("id", id)
    .maybeSingle<ServiceRow>();

  if (error) {
    logFailure(`service ${id}`, error);

    return null;
  }

  return data;
});

/**
 * The long-form page belonging to a service, if it has one.
 *
 * Keyed by `service_id` rather than its own id: there is exactly one page per
 * service (the column is unique), and every route that wants one arrives
 * holding the service, not the page.
 */
export const getServicePageFor = cache(async function getServicePageFor(
  serviceId: string,
): Promise<ServicePageRow | null> {
  const supabase = await createAuthorizedAdminClient();

  const { data, error } = await supabase
    .from("service_pages")
    .select("*")
    .eq("service_id", serviceId)
    .maybeSingle<ServicePageRow>();

  if (error) {
    logFailure(`service page for ${serviceId}`, error);

    return null;
  }

  return data;
});

/** What the lists need to know about a page, without its whole body. */
export type ServicePageSummary = Pick<
  ServicePageRow,
  "id" | "service_id" | "published" | "updated_at"
> & { headline: string | null };

/**
 * Every offence page, drafts included, keyed by the service it belongs to.
 *
 * Only the headline is taken from the body: both lists show a page's status
 * beside its service, and a page body is the largest thing in the CMS.
 */
export const listServicePages = cache(async function listServicePages(): Promise<
  Record<string, ServicePageSummary>
> {
  const supabase = await createAuthorizedAdminClient();

  const { data, error } = await supabase
    .from("service_pages")
    .select("id, service_id, published, updated_at, headline:content->>headline")
    .limit(listLimit)
    .returns<ServicePageSummary[]>();

  if (error) {
    logFailure("service pages", error);

    return {};
  }

  return Object.fromEntries((data ?? []).map((page) => [page.service_id, page]));
});

// ---------------------------------------------------------------------------
// Testimonials
// ---------------------------------------------------------------------------

export const listTestimonials = cache(async function listTestimonials(): Promise<
  TestimonialRow[]
> {
  const supabase = await createAuthorizedAdminClient();

  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .order("sort_order", { ascending: true })
    .limit(listLimit)
    .returns<TestimonialRow[]>();

  if (error) {
    logFailure("testimonials", error);

    return [];
  }

  return data ?? [];
});

export const getTestimonial = cache(async function getTestimonial(
  id: string,
): Promise<TestimonialRow | null> {
  const supabase = await createAuthorizedAdminClient();

  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .eq("id", id)
    .maybeSingle<TestimonialRow>();

  if (error) {
    logFailure(`testimonial ${id}`, error);

    return null;
  }

  return data;
});

// ---------------------------------------------------------------------------
// Blog
// ---------------------------------------------------------------------------

/** A post as the admin list shows it, with its category name resolved. */
export type AdminBlogPost = BlogPostRow & {
  blog_categories: { name: string } | null;
};

/**
 * Every post, drafts included, newest first.
 *
 * Ordered by `updated_at` rather than `published_at`: this is a work list, and
 * what John wants at the top is the draft he was last editing, not the oldest
 * article that happens to have no publication date.
 */
export const listBlogPosts = cache(async function listBlogPosts(): Promise<
  AdminBlogPost[]
> {
  const supabase = await createAuthorizedAdminClient();

  const { data, error } = await supabase
    .from("blog_posts")
    .select("*, blog_categories(name)")
    .order("updated_at", { ascending: false })
    .limit(listLimit)
    .returns<AdminBlogPost[]>();

  if (error) {
    logFailure("blog posts", error);

    return [];
  }

  return data ?? [];
});

export const getBlogPost = cache(async function getBlogPost(
  id: string,
): Promise<BlogPostRow | null> {
  const supabase = await createAuthorizedAdminClient();

  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle<BlogPostRow>();

  if (error) {
    logFailure(`blog post ${id}`, error);

    return null;
  }

  return data;
});

export const listBlogCategories = cache(
  async function listBlogCategories(): Promise<BlogCategoryRow[]> {
    const supabase = await createAuthorizedAdminClient();

    const { data, error } = await supabase
      .from("blog_categories")
      .select("*")
      .order("name", { ascending: true })
      .returns<BlogCategoryRow[]>();

    if (error) {
      logFailure("blog categories", error);

      return [];
    }

    return data ?? [];
  },
);

/**
 * How many posts sit in each category, keyed by category id.
 *
 * The categories list needs it to say what deleting one would orphan. Counted
 * in one pass over the ids rather than a query per category.
 */
export const countPostsByCategory = cache(
  async function countPostsByCategory(): Promise<Record<string, number>> {
    const supabase = await createAuthorizedAdminClient();

    const { data, error } = await supabase
      .from("blog_posts")
      .select("category_id")
      .not("category_id", "is", null)
      .returns<{ category_id: string }[]>();

    if (error) {
      logFailure("category post counts", error);

      return {};
    }

    const counts: Record<string, number> = {};

    for (const row of data ?? []) {
      counts[row.category_id] = (counts[row.category_id] ?? 0) + 1;
    }

    return counts;
  },
);

// ---------------------------------------------------------------------------
// SEO and settings
// ---------------------------------------------------------------------------

export const listSeoMetadata = cache(async function listSeoMetadata(): Promise<
  SeoRow[]
> {
  const supabase = await createAuthorizedAdminClient();

  const { data, error } = await supabase
    .from("seo_metadata")
    .select("*")
    .order("path", { ascending: true })
    .limit(listLimit)
    .returns<SeoRow[]>();

  if (error) {
    logFailure("SEO metadata", error);

    return [];
  }

  return data ?? [];
});

/** One route's override, or null when the page uses its defaults. */
export const getSeoRow = cache(async function getSeoRow(
  path: string,
): Promise<SeoRow | null> {
  const supabase = await createAuthorizedAdminClient();

  const { data, error } = await supabase
    .from("seo_metadata")
    .select("*")
    .eq("path", path)
    .maybeSingle<SeoRow>();

  if (error) {
    logFailure(`SEO metadata for ${path}`, error);

    return null;
  }

  return data;
});

export const listSiteSettings = cache(async function listSiteSettings(): Promise<
  SiteSettingRow[]
> {
  const supabase = await createAuthorizedAdminClient();

  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .order("key", { ascending: true })
    .returns<SiteSettingRow[]>();

  if (error) {
    logFailure("site settings", error);

    return [];
  }

  return data ?? [];
});

// ---------------------------------------------------------------------------
// Page sections
// ---------------------------------------------------------------------------

/**
 * The saved copy for one page's sections, keyed by section.
 *
 * Only sections that have been edited have rows. The editor fills the rest from
 * the defaults in `lib/content/pages.ts`, which is also what the site renders,
 * so an untouched section shows John exactly what a visitor sees rather than an
 * empty form.
 */
export const getPageSections = cache(async function getPageSections(
  page: string,
): Promise<Record<string, SectionContent>> {
  const supabase = await createAuthorizedAdminClient();

  const { data, error } = await supabase
    .from("page_sections")
    .select("section, content")
    .eq("page", page)
    .returns<{ section: string; content: SectionContent }[]>();

  if (error) {
    logFailure(`page sections for "${page}"`, error);

    return {};
  }

  return Object.fromEntries(
    (data ?? []).map(({ section, content }) => [section, content]),
  );
});

/**
 * Which sections have been edited, across every page.
 *
 * Drives the "edited" markers on the Website Content index. A count would not
 * do: the index lists sections from the registry, not from the table, so what
 * it needs is which of those have a row.
 */
export const listEditedSections = cache(
  async function listEditedSections(): Promise<
    { page: string; section: string; updated_at: string }[]
  > {
    const supabase = await createAuthorizedAdminClient();

    const { data, error } = await supabase
      .from("page_sections")
      .select("page, section, updated_at")
      .limit(listLimit)
      .returns<{ page: string; section: string; updated_at: string }[]>();

    if (error) {
      logFailure("edited page sections", error);

      return [];
    }

    return data ?? [];
  },
);
