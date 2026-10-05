import "server-only";

import type { Metadata } from "next";

import {
  getPageContent,
  getSeo,
  getServices,
  getSiteConfig,
} from "@/lib/cms/queries";
import { siteNodes, type PageFacts } from "@/lib/cms/seo/json-ld";
import { validateCustomJsonLd } from "@/lib/cms/seo/custom-json-ld";
import { automaticSchemaIds, validateSchemaNodes } from "@/lib/cms/seo/schema-validation";
import { deployment } from "@/lib/site-config";
import {
  defaultShareImage,
  resolveMetadata,
  resolvePageText,
} from "@/lib/cms/seo/resolve";
import { findSeoRoute } from "@/lib/cms/seo/routes";
import { resolveSection } from "@/lib/cms/sections/resolve";
import { heroDefaults } from "@/lib/content/pages";

/**
 * A public route's metadata: its registry defaults with any saved override
 * laid over them.
 *
 * What every public route's `generateMetadata` returns, so none of them holds
 * a title or a precedence rule of its own. A path that is not a public route —
 * an unpublished service, an article that does not exist — gets nothing, and
 * the page's own `notFound()` answers for it.
 */
export async function seoMetadataFor(path: string): Promise<Metadata> {
  const [route, override, config] = await Promise.all([
    findSeoRoute(path),
    getSeo(path),
    getSiteConfig(),
  ]);

  if (!route) return {};

  return resolveMetadata(
    path,
    route.defaults,
    override,
    config.name,
    defaultShareImage(config.name, config.role),
  );
}

/**
 * What a route's structured data is built from: the nodes every page carries,
 * and what this page calls itself — the same title and description as its
 * `<head>`, from the same registry and override.
 *
 * Every read is one the page has already made or is about to (the settings,
 * the catalogue for the menu, the SEO row for `generateMetadata`), and all are
 * cached for the request. The hero's portrait is the exception on pages other
 * than home. An edit to the hero rebuilds only the home page, so elsewhere
 * John's `image` can trail a replaced photograph until the next deploy; the
 * old file stays where it was, so the address still shows him.
 *
 * `fallbackTitle` covers a page that renders without a registry entry, which
 * should not happen — the registry and the pages read the same published
 * rows — but a page's markup should not go nameless if it does.
 */
export async function structuredDataFor(
  path: string,
  fallbackTitle: string,
): Promise<{
  site: ReturnType<typeof siteNodes>;
  page: PageFacts;
  lastModified?: string;
}> {
  const [route, override, config, services, home] = await Promise.all([
    findSeoRoute(path),
    getSeo(path),
    getSiteConfig(),
    getServices(),
    getPageContent("home"),
  ]);

  const site = siteNodes({
    config,
    practiceAreas: services.map((service) => service.name),
    portrait: resolveSection(heroDefaults, home.hero).portrait,
  });

  // Revalidate stored content too: a manual or legacy database edit must not
  // bypass the authenticated editor's structural safeguards.
  const custom = validateCustomJsonLd(override?.customJsonLd, path, deployment.url);
  if (custom.ok && validateSchemaNodes(custom.nodes, automaticSchemaIds(path, deployment.url)).length === 0) site.push(...custom.nodes);

  if (!route) {
    return { site, page: { path, title: fallbackTitle, canonical: path } };
  }

  return {
    site,
    page: { path, ...resolvePageText(path, route.defaults, override) },
    lastModified: route.lastModified,
  };
}
