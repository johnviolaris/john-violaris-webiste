import "server-only";

import { requireSeoEditor } from "@/lib/auth";
import { getArticles, getPagesContent, getSeoOverrides, getServicePage, getSiteConfig } from "@/lib/cms/queries";
import { pageGroups } from "@/lib/cms/sections/schema";
import { analyseSeoHealth, type SeoHealthContent } from "@/lib/cms/seo/health";
import { listSeoRoutes } from "@/lib/cms/seo/routes";
import { deployment } from "@/lib/site-config";
import { getLocationPages } from "@/lib/cms/locations/queries";
import { validateCustomJsonLd } from "@/lib/cms/seo/custom-json-ld";
import { automaticSchemaIds, validateSchemaNodes } from "@/lib/cms/seo/schema-validation";

export async function getSeoHealthReport() {
  await requireSeoEditor();
  const [routes, overrides, articles, sections, config, locations] = await Promise.all([
    listSeoRoutes(), getSeoOverrides(), getArticles(), getPagesContent(...pageGroups.map((group) => group.key)), getSiteConfig(), getLocationPages(),
  ]);
  const contents: SeoHealthContent[] = articles.map((article) => ({ path: `/blog/${article.slug}`, content: article }));
  const serviceContents = await Promise.all(routes.filter((route) => route.group === "Services").map(async (route) => ({
    path: route.path, content: await getServicePage(route.path.split("/").at(-1) ?? ""),
  })));
  contents.push(...serviceContents);
  contents.push(...locations.map((location) => ({ path: `/locations/${location.slug}`, content: location.content })));
  for (const group of pageGroups) for (const section of group.sections) {
    const content = { ...section.defaults, ...sections[group.key]?.[section.key] };
    const paths = section.appearsOn.includes("*") ? routes.map((route) => route.path) : section.appearsOn;
    for (const path of paths) contents.push({ path, content });
  }
  const issues = analyseSeoHealth({ routes, overrides, contents, siteName: config.name, siteUrl: deployment.url });
  for (const route of routes) {
    const custom = validateCustomJsonLd(overrides[route.path]?.customJsonLd, route.path, deployment.url);
    if (custom.ok) for (const warning of validateSchemaNodes(custom.nodes, automaticSchemaIds(route.path, deployment.url))) {
      issues.push({ path: route.path, label: route.label, code: "custom-schema-vocabulary", severity: "error", message: `Custom JSON-LD is omitted until corrected: ${warning}` });
    }
  }
  return {
    routes,
    issues,
  };
}
