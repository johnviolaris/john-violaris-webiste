import type { MetadataRoute } from "next";

import { deployment } from "@/lib/site-config";
import { getSiteSettings } from "@/lib/cms/queries";
import { crawlFile, resolvedCrawlSettings } from "@/lib/cms/seo/robots";

/**
 * `/robots.txt`.
 *
 * Everything public may be crawled; the admin, sign-in and API routes may not.
 * Those already send `noindex` — the admin layout says so — and are behind a
 * sign-in regardless; this keeps crawlers from spending their visit on them.
 *
 * To keep a *public* page out of search, use "Hide from search engines" under
 * SEO Metadata, not this file. A page blocked here can still be indexed from
 * links elsewhere, and a crawler that may not fetch it never sees the
 * `noindex` that would have kept it out.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const settings = await getSiteSettings();
  return crawlFile(resolvedCrawlSettings(settings.robots), deployment.url);
}
