import type { MetadataRoute } from "next";

import { getSeoOverrides } from "@/lib/cms/queries";
import { listSeoRoutes } from "@/lib/cms/seo/routes";
import { datedSitemapEntries } from "@/lib/cms/seo/sitemap-dates";
import { getSitemapDateSources } from "@/lib/cms/seo/sitemap-queries";
import { deployment } from "@/lib/site-config";
export const revalidate = 60;

/**
 * `/sitemap.xml`, built from the route registry.
 *
 * The same list the SEO admin edits, so every published page is here and
 * nothing else is: unpublished services and articles are not in the registry,
 * and admin, auth and API routes never are. A page set to "hide from search"
 * or given a canonical elsewhere is left out — see `belongsInSitemap`.
 *
 * `lastmod` uses actual public CMS source timestamps, including the relevant
 * fixed-page sections, shared settings, metadata and image descriptions.
 * A page without recorded evidence still has no date; build time is never
 * presented as an edit. Article bylines keep their independent content dates.
 *
 * Cached like any static route; every CMS write that can change it
 * revalidates `/sitemap.xml` (see `lib/cms/revalidate.ts`).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [routes, overrides, sources] = await Promise.all([
    listSeoRoutes(),
    getSeoOverrides(),
    getSitemapDateSources(),
  ]);

  return datedSitemapEntries(routes.map((route) => ({ ...route,
    // Article image descriptions are centrally editable in the media library.
    imageUrl: route.group === "Articles" ? route.defaults.image?.url : undefined,
  })), overrides, deployment.url, sources);
}
