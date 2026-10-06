import { sitemapModificationDates, type SitemapDatedRoute, type SitemapDateSources } from "@/lib/cms/seo/sitemap-dates";
import { belongsInSitemap } from "@/lib/cms/seo/resolve";
import type { SeoHealthIssue } from "@/lib/cms/seo/health";
import type { SeoContent } from "@/lib/cms/types";

export type SitemapUnavailableSource = "sections" | "seo" | "settings" | "media" | "collections" | "source-read";
export type SitemapDateSnapshot = { sources: SitemapDateSources; unavailableSources: SitemapUnavailableSource[] };
const sourceLabels: Record<SitemapUnavailableSource, string> = {
  sections: "page-section dates", seo: "SEO-override dates", settings: "site-setting dates", media: "media-description dates", collections: "service/article collection dates", "source-read": "public modification-date sources",
};

/** Private diagnostics only. Unknown dates remain omitted from the public sitemap. */
export function analyseSitemapDates(routes: readonly (SitemapDatedRoute & { label: string })[], overrides: Record<string, SeoContent>, siteUrl: string, snapshot: SitemapDateSnapshot): SeoHealthIssue[] {
  const issues: SeoHealthIssue[] = [];
  const dates = sitemapModificationDates(routes, snapshot.sources);
  if (snapshot.unavailableSources.length && routes.length) {
    issues.push({ path: routes[0].path, label: routes[0].label, code: "sitemap-date-source-unavailable", severity: "warning", message: `Could not read ${[...new Set(snapshot.unavailableSources)].map((source) => sourceLabels[source]).join(", ")}. Sitemap modification dates may be incomplete. Retry this check and investigate the source read if it persists; no replacement date was invented.` });
  }
  for (const route of routes) {
    if (belongsInSitemap(route.path, overrides[route.path] ?? null, siteUrl) && !dates.has(route.path)) {
      issues.push({ path: route.path, label: route.label, code: "sitemap-date-unknown", severity: "info", message: "No valid modification date survives in this page's current public sources. Its sitemap entry correctly omits lastmod. A code-only edit, removed row or reset may require separate dated change evidence; the build time is not a substitute." });
    }
  }
  return issues;
}
