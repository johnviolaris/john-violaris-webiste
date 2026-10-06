import "server-only";

import { cache } from "react";

import {
  toArticle,
  toService,
  toServiceDescriptions,
  toServiceGroups,
  toTestimonial,
} from "@/lib/cms/mappers";
import {
  seedBlogCategories,
  seedBlogPosts,
  seedServiceGroups,
  seedServicePages,
  seedServices,
  seedTestimonials,
} from "@/lib/cms/seed-data";
import type {
  Article,
  BlogCategoryRow,
  BlogPostContent,
  SeoContent,
  Service,
  ServiceContent,
  ServiceGroup,
  ServicePageContent,
  Testimonial,
} from "@/lib/cms/types";
import type { SectionContent } from "@/lib/cms/sections/schema";
import {
  resolveSiteConfig,
  siteSettingKeys,
  type SiteConfig,
  type SiteSettings,
} from "@/lib/site-config";
import { publicClient } from "@/utils/supabase/public";
import { getPublicMedia } from "@/lib/cms/media/queries";
import { mediaPresentation } from "@/lib/cms/media/schema";

/**
 * Public content reads.
 *
 * Three rules hold everything here together:
 *
 *  1. Anon client, no cookies. Every public page on this site is statically
 *     rendered, and a page that reads `cookies()` cannot be. RLS is what limits
 *     these reads to published rows — not an `.eq("published", true)` that a
 *     later refactor could quietly drop.
 *
 *  2. `cache()` on every read. A page and its layout render in the same pass
 *     and several of them want the service catalogue; deduping turns three
 *     identical round trips into one.
 *
 *  3. Fall back on failure, never on emptiness. If Supabase errors or is
 *     unconfigured, a safe fallback is served and the failure is logged loudly.
 *     Configured blog reads fail closed instead of bringing back seed articles
 *     that may have been withdrawn or scheduled by their editor.
 *     If it answers with no rows, that is the truthful answer — nothing is
 *     published — and the page renders empty. Anything else would make it
 *     impossible for John to unpublish the last testimonial.
 *
 * Admin reads, which must also see drafts, live in `lib/cms/admin-queries.ts`.
 */

/**
 * Run a read, or fall back to the static seed and say so.
 *
 * `console.error` rather than a rethrow on purpose: at build time a throw would
 * fail the deploy over content that has a perfectly good local copy, and during
 * revalidation it would serve a stale page with no explanation. Both are worse
 * than correct content plus a loud log.
 */
async function safely<T>(
  label: string,
  run: () => Promise<T>,
  fallback: () => T,
): Promise<T> {
  try {
    return await run();
  } catch (error) {
    console.error(
      `[cms] ${label} could not be read from Supabase — using its safe fallback.`,
      error,
    );

    return fallback();
  }
}

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

type ServiceSelect = {
  slug: string;
  name: string;
  content: ServiceContent;
};

const serviceSelect = "slug, name, content";

/** Published services, in catalogue order. */
const getServiceRows = cache(async function getServiceRows(): Promise<ServiceSelect[]> {
  return safely(
    "Service catalogue",
    async () => {
      const { data, error } = await publicClient()
        .from("services")
        .select(serviceSelect)
        .order("sort_order", { ascending: true })
        .returns<ServiceSelect[]>();

      if (error) throw error;

      return data ?? [];
    },
    () => seedServices,
  );
});

type ServiceGroupSelect = {
  name: string;
  motoring: boolean;
};

/**
 * The groups, in menu order. RLS shows visitors only groups with a published
 * service, so a group being prepared never reaches the page.
 */
const getServiceGroupRows = cache(async function getServiceGroupRows(): Promise<
  ServiceGroupSelect[]
> {
  return safely(
    "Service groups",
    async () => {
      const { data, error } = await publicClient()
        .from("service_groups")
        .select("name, motoring")
        .order("sort_order", { ascending: true })
        .returns<ServiceGroupSelect[]>();

      if (error) throw error;

      return data ?? [];
    },
    () => seedServiceGroups,
  );
});

/** The grouped catalogue behind the mega-menu and the services index. */
export const getServiceGroups = cache(
  async function getServiceGroups(): Promise<ServiceGroup[]> {
    const [rows, groups] = await Promise.all([
      getServiceRows(),
      getServiceGroupRows(),
    ]);

    return toServiceGroups(rows, groups);
  },
);

/** Every published service, flat. */
export const getServices = cache(async function getServices(): Promise<Service[]> {
  return (await getServiceRows()).map(toService);
});

/** The subset shown in the compact rail beneath the hero. */
export const getFeaturedServices = cache(
  async function getFeaturedServices(): Promise<Service[]> {
    return (await getServices()).filter((service) => service.featured);
  },
);

/** Service intros keyed by href, shaped as `serviceDescriptions` is today. */
export const getServiceDescriptions = cache(
  async function getServiceDescriptions(): Promise<Record<string, { intro: string }>> {
    return toServiceDescriptions(await getServiceRows());
  },
);

type ServicePageSelect = {
  content: ServicePageContent;
  services: ServiceSelect;
};

/**
 * One offence page and the service it belongs to.
 *
 * An inner join rather than two queries: an unpublished service must not leave
 * a published page of its own reachable, and the join expresses that inside the
 * query instead of in a forgettable check afterwards.
 */
export const getServicePage = cache(async function getServicePage(
  slug: string,
): Promise<{ service: Service; detail: ServicePageContent } | null> {
  return safely(
    `Service page "${slug}"`,
    async () => {
      const { data, error } = await publicClient()
        .from("service_pages")
        .select(`content, services!inner(${serviceSelect})`)
        .eq("services.slug", slug)
        .maybeSingle<ServicePageSelect>();

      if (error) throw error;
      if (!data) return null;

      return { service: toService(data.services), detail: data.content };
    },
    () => {
      const page = seedServicePages.find((row) => row.serviceSlug === slug);
      const service = seedServices.find((row) => row.slug === slug);

      if (!page || !service) return null;

      return { service: toService(service), detail: page.content };
    },
  );
});

/**
 * Slugs with a published page, for `generateStaticParams`.
 *
 * Not every service has one — police station representation is served by its
 * own route — so this asks the join rather than assuming the whole catalogue.
 */
export const getServicePageSlugs = cache(
  async function getServicePageSlugs(): Promise<string[]> {
    return safely(
      "Service page slugs",
      async () => {
        const { data, error } = await publicClient()
          .from("service_pages")
          .select("services!inner(slug)")
          .returns<{ services: { slug: string } }[]>();

        if (error) throw error;

        return (data ?? []).map((row) => row.services.slug);
      },
      () => seedServicePages.map((row) => row.serviceSlug),
    );
  },
);

// ---------------------------------------------------------------------------
// Testimonials
// ---------------------------------------------------------------------------

type TestimonialSelect = {
  author: string;
  quote: string;
  rating: number | null;
  content: import("@/lib/cms/types").TestimonialContent;
};

export const getTestimonials = cache(
  async function getTestimonials(): Promise<Testimonial[]> {
    return safely(
      "Testimonials",
      async () => {
        const { data, error } = await publicClient()
          .from("testimonials")
          .select("author, quote, rating, content")
          .order("sort_order", { ascending: true })
          .returns<TestimonialSelect[]>();

        if (error) throw error;

        return (data ?? []).map(toTestimonial);
      },
      () => seedTestimonials.map(toTestimonial),
    );
  },
);

// ---------------------------------------------------------------------------
// Blog
// ---------------------------------------------------------------------------

type BlogPostSelect = {
  slug: string;
  title: string;
  published_at: string | null;
  content: BlogPostContent;
  blog_categories: { name: string } | null;
};

const blogPostSelect = "slug, title, published_at, content, blog_categories(name)";

/** Shown when a post has no category, rather than an empty pill on the card. */
const uncategorised = "Guides";
async function withArticleMedia(row: BlogPostSelect): Promise<BlogPostSelect> {
  const asset = row.content.featuredImage ? (await getPublicMedia()).get(row.content.featuredImage) : undefined;
  if (!asset) return row;
  const image = mediaPresentation(asset);
  return { ...row, content: { ...row.content, featuredImageAlt: image.alt, featuredImageTitle: image.title, featuredImageCaption: image.caption, featuredImageCaptionFormat: image.captionFormat } };
}
// A configured CMS failure must not resurrect a seed article that an editor
// has withdrawn or scheduled. Seed articles are only for an unconfigured demo.
function canUseSeedArticles() {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
}

/** Category name for a seeded post, for the fallback path. */
function seedCategoryName(categorySlug: string): string {
  return (
    seedBlogCategories.find((category) => category.slug === categorySlug)?.name ??
    uncategorised
  );
}

/**
 * Published articles, newest first.
 *
 * `published_at` is null on the seeded articles — they carry no publication
 * date, and inventing one would date content John has not yet approved — so the
 * ordering falls through to `created_at`, keeping undated posts in a stable
 * order rather than whatever Postgres returns.
 */
export const getArticles = cache(async function getArticles(): Promise<Article[]> {
  return safely(
    "Articles",
    async () => {
      const { data, error } = await publicClient()
        .from("blog_posts")
        .select(blogPostSelect)
        .eq("published", true)
        .or(`published_at.is.null,published_at.lte.${new Date().toISOString()}`)
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .returns<BlogPostSelect[]>();

      if (error) throw error;

      return Promise.all((data ?? []).map(async (row) =>
        toArticle(await withArticleMedia(row), row.blog_categories?.name ?? uncategorised),
      ));
    },
    () =>
      canUseSeedArticles()
        ? seedBlogPosts.map((row) => toArticle(row, seedCategoryName(row.categorySlug)))
        : [],
  );
});

export const getArticle = cache(async function getArticle(
  slug: string,
): Promise<Article | null> {
  return safely(
    `Article "${slug}"`,
    async () => {
      const { data, error } = await publicClient()
        .from("blog_posts")
        .select(blogPostSelect)
        .eq("slug", slug)
        .eq("published", true)
        .or(`published_at.is.null,published_at.lte.${new Date().toISOString()}`)
        .maybeSingle<BlogPostSelect>();

      if (error) throw error;
      if (!data) return null;

      return toArticle(await withArticleMedia(data), data.blog_categories?.name ?? uncategorised);
    },
    () => {
      if (!canUseSeedArticles()) return null;
      const row = seedBlogPosts.find((post) => post.slug === slug);

      return row ? toArticle(row, seedCategoryName(row.categorySlug)) : null;
    },
  );
});

export const getBlogCategories = cache(
  async function getBlogCategories(): Promise<
    Pick<BlogCategoryRow, "slug" | "name">[]
  > {
    return safely(
      "Blog categories",
      async () => {
        const { data, error } = await publicClient()
          .from("blog_categories")
          .select("slug, name")
          .order("name", { ascending: true })
          .returns<Pick<BlogCategoryRow, "slug" | "name">[]>();

        if (error) throw error;

        return data ?? [];
      },
      () => seedBlogCategories,
    );
  },
);

// ---------------------------------------------------------------------------
// Route index
// ---------------------------------------------------------------------------

/** A published service, as the route registry needs it. */
export type IndexedService = {
  slug: string;
  name: string;
  content: ServiceContent;
  updated_at: string | null;
  /** The published offence page's standfirst and edit time, if it has one. */
  page: { intro: string | null; updated_at: string | null } | null;
};

/** A published article, as the route registry needs it — no body. */
export type IndexedArticle = {
  slug: string;
  title: string;
  updated_at: string | null;
  published_at: string | null;
  excerpt: string | null;
  featuredImage: string | null;
  featuredImageAlt: string | null;
};

type PageEmbed = { intro: string | null; updated_at: string };

/**
 * Every published service and article, with the little the route registry
 * needs: what to call the route, what it says by default, and when it last
 * changed. Two queries for the whole site, not one per route.
 *
 * The article body is left behind — it is the largest thing in the CMS, and
 * nothing here reads it. The page embed rides RLS like everything else, so an
 * unpublished page arrives as null and its service falls back to the card
 * summary, as the page itself does.
 *
 * The fallback has no dates, and the sitemap then leaves `lastmod` out rather
 * than stating the build time as though it were an edit.
 */
type RouteIndex = {
  services: IndexedService[];
  articles: IndexedArticle[];
  sourceAvailable: boolean;
};

export const getRouteIndex = cache(async function getRouteIndex(): Promise<RouteIndex> {
  return safely<RouteIndex>(
    "Route index",
    async () => {
      const [services, articles] = await Promise.all([
        publicClient()
          .from("services")
          .select(
            "slug, name, content, updated_at, service_pages(intro:content->>intro, updated_at)",
          )
          .order("sort_order", { ascending: true })
          .returns<
            (Omit<IndexedService, "page"> & {
              service_pages: PageEmbed | PageEmbed[] | null;
            })[]
          >(),
        publicClient()
          .from("blog_posts")
          .select(
            "slug, title, updated_at, published_at, excerpt:content->>excerpt, featuredImage:content->>featuredImage, featuredImageAlt:content->>featuredImageAlt",
          )
          .eq("published", true)
          .or(`published_at.is.null,published_at.lte.${new Date().toISOString()}`)
          .order("published_at", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false })
          .returns<IndexedArticle[]>(),
      ]);

      if (services.error) throw services.error;
      if (articles.error) throw articles.error;

      return {
        sourceAvailable: true,
        services: (services.data ?? []).map(
          ({ service_pages, ...service }): IndexedService => ({
            ...service,
            // One page per service, so PostgREST returns an object; an array
            // is accepted too rather than trusting the relationship detection.
            page: Array.isArray(service_pages)
              ? (service_pages[0] ?? null)
              : service_pages,
          }),
        ),
        articles: articles.data ?? [],
      };
    },
    () => ({
      sourceAvailable: false,
      services: seedServices.map((service) => {
        const page = seedServicePages.find(
          (row) => row.serviceSlug === service.slug,
        );

        return {
          slug: service.slug,
          name: service.name,
          content: service.content,
          updated_at: null,
          page: page ? { intro: page.content.intro, updated_at: null } : null,
        };
      }),
      articles: canUseSeedArticles() ? seedBlogPosts.map((post) => ({
        slug: post.slug,
        title: post.title,
        updated_at: null,
        published_at: post.published_at,
        excerpt: post.content.excerpt,
        featuredImage: post.content.featuredImage ?? null,
        featuredImageAlt: post.content.featuredImageAlt ?? null,
      })) : [],
    }),
  );
});

// ---------------------------------------------------------------------------
// SEO and settings
// ---------------------------------------------------------------------------

/**
 * Per-route SEO overrides, or null when the route has none.
 *
 * Null is the normal case, not a failure: a page that has never been given an
 * override keeps the title and description written in its own file. The admin
 * section fills these in, and `generateMetadata` layers them over the page
 * defaults rather than replacing them wholesale.
 */
export const getSeo = cache(async function getSeo(
  path: string,
): Promise<SeoContent | null> {
  return safely(
    `SEO metadata for "${path}"`,
    async () => {
      const { data, error } = await publicClient()
        .from("seo_metadata")
        .select("content")
        .eq("path", path)
        .maybeSingle<{ content: SeoContent }>();

      if (error) throw error;

      return data?.content ?? null;
    },
    () => null,
  );
});

/**
 * Every SEO override, keyed by path.
 *
 * For the sitemap, which has to know which routes asked to be left out of
 * search, and would otherwise make one `getSeo` round trip per URL.
 */
export const getSeoOverrides = cache(async function getSeoOverrides(): Promise<
  Record<string, SeoContent>
> {
  return safely(
    "SEO metadata",
    async () => {
      const { data, error } = await publicClient()
        .from("seo_metadata")
        .select("path, content")
        .returns<{ path: string; content: SeoContent }[]>();

      if (error) throw error;

      return Object.fromEntries(
        (data ?? []).map(({ path, content }) => [path, content]),
      );
    },
    () => ({}),
  );
});

/**
 * Every site setting, as one object.
 *
 * One query rather than one per key: there are a dozen of them, they are all
 * tiny, and most pages want several. Callers read what they need from the
 * result; `lib/site-config.ts` stays the place that supplies the defaults when
 * a key is unset.
 */
/**
 * The resolved site configuration: stored settings over the defaults, with the
 * derived links worked out.
 *
 * This is what components use. `getSiteSettings` below returns the raw rows and
 * is for the admin screen that edits them.
 *
 * `cache()` matters more here than anywhere else in this file: the header, the
 * footer, the contact bar and the page itself all want the configuration, and
 * without deduping that is four identical round trips per render.
 */
export const getSiteConfig = cache(async function getSiteConfig(): Promise<
  SiteConfig
> {
  const stored = await getSiteSettings();
  const values: Partial<SiteSettings> = {};

  /*
   * Only known keys, and only strings.
   *
   * `site_settings` is key/value and holds whatever has been written into it,
   * including the deployment keys the seed put there before they were settled
   * as non-editable. Reading by `siteSettingKeys` rather than by whatever came
   * back means a stray row cannot reach the site, and a jsonb value that is a
   * number or an object is ignored rather than rendered as "[object Object]"
   * somewhere in the footer.
   */
  for (const key of siteSettingKeys) {
    const value = stored[key];

    if (typeof value === "string") {
      values[key] = value;
    }
  }

  return resolveSiteConfig(values);
});

export const getSiteSettings = cache(
  async function getSiteSettings(): Promise<Record<string, unknown>> {
    return safely(
      "Site settings",
      async () => {
        const { data, error } = await publicClient()
          .from("site_settings")
          .select("key, value")
          .returns<{ key: string; value: unknown }[]>();

        if (error) throw error;

        return Object.fromEntries(
          (data ?? []).map(({ key, value }) => [key, value]),
        );
      },
      () => ({}),
    );
  },
);

// ---------------------------------------------------------------------------
// Page sections
// ---------------------------------------------------------------------------

/**
 * The edited copy for one page, keyed by section.
 *
 * Note the third rule at the top of this file is applied differently here, and
 * the difference is the point. Elsewhere "no rows" is a truthful answer that
 * must be rendered — nothing is published. `page_sections` has no publish flag,
 * so a missing row does not mean "this section is hidden", it means "nobody has
 * edited this section". The caller resolves what comes back over the defaults
 * in `lib/content/pages.ts`, so an absent section renders the copy the page was
 * written with. That is why this returns only what exists rather than falling
 * back to a seeded copy of the whole page.
 *
 * A failure still falls back, to an empty map — which is to say, to the static
 * defaults for every section. A page whose copy has never been edited and a
 * page whose database is unreachable render identically, and only the second
 * one logs.
 */
async function withPortraitMedia(content: Record<string, SectionContent>, page: string) {
  if (page !== "home") return content;
  const hero = content.hero ?? {};
  const url = typeof hero.portrait === "string" ? hero.portrait : "/john-violaris-portrait.webp";
  const asset = (await getPublicMedia()).get(url === "/Profile 7.png" ? "/john-violaris-portrait.webp" : url);
  if (!asset) return content;
  const image = mediaPresentation(asset);
  return { ...content, hero: { ...hero, portraitAlt: image.alt, portraitTitle: image.title ?? "", portraitCaption: image.caption ?? "", portraitCaptionFormat: image.captionFormat } };
}

export const getPageContent = cache(async function getPageContent(
  page: string,
): Promise<Record<string, SectionContent>> {
  return safely(
    `Page content for "${page}"`,
    async () => {
      const { data, error } = await publicClient()
        .from("page_sections")
        .select("section, content")
        .eq("page", page)
        .returns<{ section: string; content: SectionContent }[]>();

      if (error) throw error;

      return withPortraitMedia(Object.fromEntries(
        (data ?? []).map(({ section, content }) => [section, content]),
      ), page);
    },
    () => ({}),
  );
});

/**
 * The same, for several pages at once.
 *
 * The home page draws on four groups — `home`, `about`, `fees` and `shared` —
 * because the sections it shares with other pages are edited where they belong
 * rather than duplicated. One round trip covers them.
 */
export const getPagesContent = cache(async function getPagesContent(
  ...pages: string[]
): Promise<Record<string, Record<string, SectionContent>>> {
  return safely(
    `Page content for ${pages.join(", ")}`,
    async () => {
      const { data, error } = await publicClient()
        .from("page_sections")
        .select("page, section, content")
        .in("page", pages)
        .returns<{ page: string; section: string; content: SectionContent }[]>();

      if (error) throw error;

      const grouped: Record<string, Record<string, SectionContent>> =
        Object.fromEntries(pages.map((page) => [page, {}]));

      for (const row of data ?? []) {
        (grouped[row.page] ??= {})[row.section] = row.content;
      }

      if (grouped.home) grouped.home = await withPortraitMedia(grouped.home, "home");

      return grouped;
    },
    () => Object.fromEntries(pages.map((page) => [page, {}])),
  );
});
