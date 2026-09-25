import "server-only";

import { cache } from "react";

import { getRouteIndex } from "@/lib/cms/queries";
import type { RouteDefaults } from "@/lib/cms/seo/resolve";
import { blogIntroDefaults, pageIntroDefaults } from "@/lib/content/pages";

/**
 * Every public route that belongs in search, and what each says by default.
 *
 * One list with three readers, and that is the point of it:
 *
 *  - Each route's `generateMetadata`, through `seoMetadataFor`, takes its
 *    defaults from here rather than writing them out itself.
 *  - The SEO Metadata admin lists these routes and shows John what a page says
 *    until he overrides it — the same text a visitor's browser gets.
 *  - `app/sitemap.ts` is built from it.
 *
 * So a route added here is titled, editable and in the sitemap at once, and a
 * route cannot be in the sitemap without being editable or the other way
 * round. The save action also refuses any path not on this list, which is
 * what stops a hand-made request from writing overrides for addresses that do
 * not exist.
 *
 * Unpublished services and articles are absent, because their URLs are not
 * public. Admin, auth and API routes are never here.
 */

export type SeoRouteGroup = "Pages" | "Services" | "Articles";

export type SeoRoute = {
  path: string;
  /** What the admin calls it. */
  label: string;
  group: SeoRouteGroup;
  defaults: RouteDefaults;
  /**
   * When the content behind it last changed. Only routes backed by a row have
   * one; the fixed pages leave it out rather than claim the build time.
   */
  lastModified?: string;
};

/** The home page's own words, which no other module holds. */
const homeDefaults: RouteDefaults = {
  title: "Criminal Defence & Motoring Offence Solicitor — England & Wales",
  description:
    "Facing a driving ban, court hearing or police interview? John Violaris is a criminal defence solicitor with 20+ years' experience and 10,000+ clients represented. Free initial consultation.",
};

/** The fixed pages, in the order the main navigation lists them. */
const fixedPages: { path: string; label: string; key: string }[] = [
  { path: "/about", label: "About", key: "about" },
  { path: "/services", label: "Services", key: "services" },
  { path: "/police-station", label: "Police Station", key: "police-station" },
  { path: "/fees", label: "Fees", key: "fees" },
  { path: "/reviews", label: "Reviews", key: "reviews" },
  { path: "/contact", label: "Contact", key: "contact" },
  { path: "/cookies", label: "Cookie policy", key: "cookies" },
];

/** Newest of two optional timestamps. */
function latest(...values: (string | null | undefined)[]): string | undefined {
  const dates = values.filter((value): value is string => Boolean(value));

  return dates.length > 0 ? dates.sort().at(-1) : undefined;
}

export const listSeoRoutes = cache(async function listSeoRoutes(): Promise<
  SeoRoute[]
> {
  const { services, articles } = await getRouteIndex();

  const pages: SeoRoute[] = [
    { path: "/", label: "Home", group: "Pages", defaults: homeDefaults },
    ...fixedPages.map(({ path, label, key }): SeoRoute => ({
      path,
      label,
      group: "Pages",
      // The heading's eyebrow and the standfirst, as the page has always
      // used for its title and description.
      defaults: {
        title: pageIntroDefaults[key].eyebrow,
        description: pageIntroDefaults[key].description,
      },
    })),
    {
      path: "/blog",
      label: "Resources",
      group: "Pages",
      defaults: {
        title: blogIntroDefaults.eyebrow,
        description: blogIntroDefaults.description,
      },
    },
  ];

  // Police station representation links to its own page, which is already
  // listed above; only services with an offence page of their own belong here.
  const offencePages = services
    .filter((service) => !service.content.href)
    .map(
      (service): SeoRoute => ({
        path: `/services/${service.slug}`,
        label: service.name,
        group: "Services",
        defaults: {
          // The offence leads, because the offence is what was searched for.
          title: `${service.name} Solicitor`,
          description:
            service.page?.intro ?? service.content.intro ?? undefined,
        },
        lastModified: latest(service.updated_at, service.page?.updated_at),
      }),
    );

  const articlePages = articles.map(
    (article): SeoRoute => ({
      path: `/blog/${article.slug}`,
      label: article.title,
      group: "Articles",
      defaults: {
        title: article.title,
        description: article.excerpt ?? undefined,
        ogType: "article",
        ...(article.featuredImage
          ? {
              image: {
                url: article.featuredImage,
                alt: article.featuredImageAlt ?? undefined,
              },
            }
          : {}),
        ...(article.published_at ? { publishedTime: article.published_at } : {}),
      },
      lastModified: latest(article.updated_at),
    }),
  );

  return [...pages, ...offencePages, ...articlePages];
});

/** One route by path, or undefined when it is not a public route. */
export async function findSeoRoute(path: string): Promise<SeoRoute | undefined> {
  return (await listSeoRoutes()).find((route) => route.path === path);
}
