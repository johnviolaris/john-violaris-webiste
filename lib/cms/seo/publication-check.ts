import "server-only";

import { getSiteConfig } from "@/lib/cms/queries";
import { getSeoRowForEditor } from "@/lib/cms/seo/admin-queries";
import { listSeoRoutes } from "@/lib/cms/seo/routes";
import { publicationSeoWarnings } from "@/lib/cms/seo/publication-warnings";
import type { RouteDefaults } from "@/lib/cms/seo/resolve";
import { deployment } from "@/lib/site-config";

export async function getPublicationSeoWarnings(path: string, defaults: RouteDefaults, content?: unknown, dates?: { publishedAt?: string | null; modifiedAt?: string }): Promise<string[]> {
  const [row, config, knownRoutes] = await Promise.all([getSeoRowForEditor(path), getSiteConfig(), listSeoRoutes()]);
  return publicationSeoWarnings({ path, defaults, content, override: row?.content, siteName: config.name, siteUrl: deployment.url, knownRoutes, ...dates });
}
