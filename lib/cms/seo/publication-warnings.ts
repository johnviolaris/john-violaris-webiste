import { analyseSeoHealth, type SeoHealthRoute } from "@/lib/cms/seo/health";
import { validateCustomJsonLd } from "@/lib/cms/seo/custom-json-ld";
import { articleId, blogPostingNode, faqPageNode, serviceNode, webPageNode } from "@/lib/cms/seo/json-ld";
import { validateFaqItems } from "@/lib/cms/faq";
import { resolvePageText, type RouteDefaults } from "@/lib/cms/seo/resolve";
import { automaticSchemaIds, validateSchemaNodes } from "@/lib/cms/seo/schema-validation";
import type { SeoContent } from "@/lib/cms/types";

export type PublicationSeoInput = {
  path: string;
  defaults: RouteDefaults;
  content?: unknown;
  override?: SeoContent | null;
  siteName: string;
  siteUrl: string;
  publishedAt?: string | null;
  modifiedAt?: string;
  knownRoutes?: SeoHealthRoute[];
};

/** Validate the pending content through the same automatic builders before publishing. */
export function publicationSeoWarnings(input: PublicationSeoInput): string[] {
  const { path, defaults, override = null, siteName, siteUrl } = input;
  const route = { path, label: defaults.title, defaults };
  const routes = [...(input.knownRoutes ?? []).filter((entry) => entry.path !== path), route];
  const warnings = analyseSeoHealth({ routes, overrides: override ? { [path]: override } : {}, contents: input.content === undefined ? [] : [{ path, content: input.content }], siteName, siteUrl })
    .filter((issue) => issue.path === path && issue.severity !== "info").map((issue) => issue.message);
  const text = resolvePageText(path, defaults, override);
  const isArticle = path.startsWith("/blog/") && defaults.ogType === "article";
  const supportsFaq = isArticle || path.startsWith("/services/");
  const content = input.content && typeof input.content === "object" ? input.content as Record<string, unknown> : {};
  const faqs = validateFaqItems(content.faqItems);
  if (supportsFaq && !faqs.ok) warnings.push(`FAQs: ${faqs.error}`);
  const faq = supportsFaq && faqs.ok ? faqPageNode({ path, items: faqs.items }) : null;
  const nodes = [webPageNode({ page: { path, ...text }, hasBreadcrumb: path !== "/", ...(isArticle ? { about: null, mainEntity: { "@id": articleId(path) } } : {}), ...(faq ? { hasPart: { "@id": faq["@id"] } } : {}) })];
  if (faq) nodes.push(faq);
  if (path.startsWith("/blog/") && defaults.ogType === "article") {
    if (!input.publishedAt && !defaults.publishedTime) warnings.push("The article has no publication date for its BlogPosting schema.");
    nodes.push(blogPostingNode({ path, headline: defaults.title, description: text.description, image: defaults.image?.url, datePublished: input.publishedAt ?? defaults.publishedTime, dateModified: input.modifiedAt }));
  }
  if (path.startsWith("/services/")) nodes.push(serviceNode({ path, name: defaults.title, description: text.description ?? "", jurisdiction: "England and Wales" }));
  // Reserved IDs refer to the common site/breadcrumb graph assembled by the public renderer.
  const commonIds = automaticSchemaIds(path, siteUrl, Boolean(faq)).filter((id) => !nodes.some((node) => node["@id"] === id));
  warnings.push(...validateSchemaNodes(nodes, commonIds).map((message) => `Structured data: ${message}`));
  const custom = validateCustomJsonLd(override?.customJsonLd, path, siteUrl);
  if (custom.ok) warnings.push(...validateSchemaNodes(custom.nodes, automaticSchemaIds(path, siteUrl, Boolean(faq))).map((message) => `Custom structured data: ${message}`));
  return [...new Set(warnings)];
}
