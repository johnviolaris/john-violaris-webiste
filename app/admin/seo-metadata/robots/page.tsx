import type { Metadata } from "next";
import { SeoRobotsForm } from "@/components/admin/seo-robots-form";
import { RevisionHistory } from "@/components/admin/revision-history";
import { getRobotsForEditor } from "@/lib/cms/seo/admin-queries";
import { resolvedCrawlSettings } from "@/lib/cms/seo/robots";
import { deployment } from "@/lib/site-config";

export const metadata: Metadata = { title: "Crawl rules" };

export default async function CrawlRulesPage() {
  const stored = await getRobotsForEditor();
  return <div className="mx-auto w-full max-w-3xl px-4 pt-14 pb-12 md:px-8 md:pt-10"><h1 className="font-display text-2xl font-semibold">Crawl rules</h1><p className="mt-2 mb-6 text-sm text-muted-foreground">These settings control which pages crawlers can fetch. A blocked page can still appear in search. Use the page’s “Hide from search engines” SEO setting to request removal, and keep that page crawlable so its noindex instruction can be read.</p><SeoRobotsForm initialRules={JSON.stringify(resolvedCrawlSettings(stored), null, 2)} siteUrl={deployment.url} /><RevisionHistory entity="site_settings" id="robots" /></div>;
}
