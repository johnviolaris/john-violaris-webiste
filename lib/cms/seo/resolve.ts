import type { Metadata } from "next";

import type { SeoContent } from "@/lib/cms/types";

/**
 * How a public route's metadata is worked out — the one place that decides it.
 *
 * Three layers can say something about a page's `<head>`, lowest first:
 *
 *  1. The root layout: `metadataBase`, the " | John Violaris" title template,
 *     the fallback description and the default robots directive.
 *  2. The route's own defaults — its heading, its standfirst, an article's
 *     featured image. They live in the route registry, `lib/cms/seo/routes.ts`,
 *     so the SEO admin can show John exactly what a page says until he
 *     changes it.
 *  3. An override saved under SEO Metadata, matched on the exact path.
 *
 * Every public route goes through `resolveMetadata`, and none assembles its
 * own precedence. That is SEO requirement REQ-009, and the reason is
 * practical: when a title is wrong, there is one function to read.
 *
 * Pure on purpose — no database, no `server-only` — so the order can be tested
 * on its own. `seoMetadataFor` in `lib/cms/seo/metadata.ts` is the server
 * wrapper the routes call.
 */

/** An image for `og:image`, with what it shows. */
export type ShareImage = {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
};

/**
 * The branded card at `/share-image`, for pages with no image of their own.
 *
 * Its dimensions are stated so a preview can lay the card out before it has
 * downloaded it; its description names what it shows.
 */
export function defaultShareImage(name: string, role: string): ShareImage {
  return {
    url: "/share-image",
    width: 1200,
    height: 630,
    alt: `${name}, ${role}`,
  };
}

/** What a route says about itself before anyone overrides it. */
export type RouteDefaults = {
  /** The part before the title template's suffix. */
  title: string;
  description?: string;
  /** `article` for a blog post, which also carries `publishedTime`. */
  ogType?: "website" | "article";
  image?: ShareImage;
  publishedTime?: string;
};

/**
 * What follows a page title in `<title>`: " | John Violaris".
 *
 * The root layout builds its title template from this, and the share title
 * below adds it by hand — Next applies the template to `<title>` but not to an
 * `openGraph.title` a route sets itself. One definition, so the two cannot
 * drift apart.
 */
export function titleSuffix(siteName: string): string {
  return ` | ${siteName}`;
}

/**
 * Treat blank as unset.
 *
 * The editor stores only what was filled in, but a value that is all spaces —
 * or a row written by hand — must fall through to the default rather than
 * render an empty `<title>`.
 */
function set(value: string | undefined): string | undefined {
  const trimmed = typeof value === "string" ? value.trim() : "";

  return trimmed ? trimmed : undefined;
}

/**
 * A route's title, description and canonical path, override first.
 *
 * Its own function because two readers need the same answer: the `<head>`,
 * below, and the page's structured data, which should name the page exactly
 * as its `<title>` does.
 */
export function resolvePageText(
  path: string,
  defaults: RouteDefaults,
  override: SeoContent | null,
): { title: string; description?: string; canonical: string } {
  return {
    title: set(override?.title) ?? defaults.title,
    description: set(override?.description) ?? defaults.description,
    canonical: set(override?.canonical) ?? path,
  };
}

/**
 * Lay an override over a route's defaults.
 *
 * The share image has one more layer than the rest: an override's image, then
 * the route's own (an article's featured image), then `fallbackImage` — the
 * site's default card — so a shared link never arrives as bare text.
 *
 * `openGraph` is always built whole, never partially. Next merges metadata
 * shallowly: a page that sets any `openGraph` field replaces the root
 * layout's entire `openGraph` object, site name and locale included. So they
 * are set here on every route, and `siteName` is passed in rather than
 * trusted to inheritance.
 *
 * `robots` is only included when an override changes it. Left out, the page
 * inherits the root layout's `index, follow`; set to anything, even
 * `undefined`, it would replace it.
 */
export function resolveMetadata(
  path: string,
  defaults: RouteDefaults,
  override: SeoContent | null,
  siteName: string,
  fallbackImage?: ShareImage,
): Metadata {
  const { title, description, canonical } = resolvePageText(
    path,
    defaults,
    override,
  );

  const overrideImage = set(override?.ogImage);
  const image = overrideImage
    ? { url: overrideImage, alt: set(override?.ogImageAlt) }
    : (defaults.image ?? fallbackImage);

  const type = override?.ogType === "website" || override?.ogType === "article"
    ? override.ogType
    : defaults.ogType ?? "website";
  const ogDescription = set(override?.ogDescription) ?? description;

  /*
   * A page shares its full title, name included — which is what Next produced
   * on its own before routes set `openGraph`. An article shares the headline
   * alone, as it always has: the name travels in `og:site_name`, and a
   * headline reads better in a WhatsApp preview without it. A share title
   * written in the editor is used exactly as written.
   */
  const ogTitle =
    set(override?.ogTitle) ??
    (type === "article" ? title : `${title}${titleSuffix(siteName)}`);

  const twitterImage = set(override?.twitterImage);
  const xImage = twitterImage
    ? { url: twitterImage, alt: set(override?.twitterImageAlt) }
    : image;

  const metadata: Metadata = {
    title,
    ...(description ? { description } : {}),
    alternates: { canonical },
    openGraph: {
      type,
      locale: "en_GB",
      siteName,
      url: canonical,
      title: ogTitle,
      ...(ogDescription ? { description: ogDescription } : {}),
      ...(image ? { images: [image] } : {}),
      ...(type === "article" && defaults.publishedTime
        ? { publishedTime: defaults.publishedTime }
        : {}),
    },
    twitter: {
      card: override?.twitterCard === "summary" ? "summary" : "summary_large_image",
      title: set(override?.twitterTitle) ?? ogTitle,
      ...(set(override?.twitterDescription) ?? ogDescription
        ? { description: set(override?.twitterDescription) ?? ogDescription }
        : {}),
      ...(xImage ? { images: [xImage] } : {}),
    },
  };

  if (override?.noIndex || override?.noFollow) {
    metadata.robots = {
      index: !override.noIndex,
      follow: !override.noFollow,
    };
  }

  return metadata;
}

/**
 * Whether a route belongs in the sitemap.
 *
 * Not when it asks to be left out of search, and not when its canonical
 * points somewhere else: listing a URL in the sitemap while its own page says
 * the real one is elsewhere sends search engines two answers.
 */
export function belongsInSitemap(
  path: string,
  override: SeoContent | null,
  siteUrl: string,
): boolean {
  if (override?.noIndex) return false;

  const canonical = set(override?.canonical);

  if (!canonical) return true;

  return new URL(canonical, siteUrl).href === new URL(path, siteUrl).href;
}
