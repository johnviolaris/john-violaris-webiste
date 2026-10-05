import { validateCustomJsonLd } from "@/lib/cms/seo/custom-json-ld";
import { resolvePageText, titleSuffix, type RouteDefaults } from "@/lib/cms/seo/resolve";
import { descriptionWarnAt, titleWarnAt } from "@/lib/cms/seo/schema";
import type { SeoContent } from "@/lib/cms/types";

export type SeoHealthIssue = {
  path: string;
  label: string;
  code: string;
  severity: "error" | "warning" | "info";
  message: string;
};
export type SeoHealthRoute = { path: string; label: string; defaults: RouteDefaults };
export type SeoHealthContent = { path: string; content: unknown };

export function normaliseSeoText(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-GB");
}

/** Finds content hrefs and explicit article-to-service relationships. */
export function internalLinkPaths(content: unknown, siteUrl: string): string[] {
  const paths = new Set<string>();
  const visit = (value: unknown) => {
    if (Array.isArray(value)) { value.forEach(visit); return; }
    if (typeof value !== "object" || value === null) return;
    for (const [key, child] of Object.entries(value)) {
      if (typeof child === "string" && child.trim() && (/(?:^|[A-Z_])href$/i.test(key) || key === "relatedService")) {
        const target = key === "relatedService" && !child.startsWith("/") && !/^https?:\/\//i.test(child) ? `/services/${child}` : child;
        if (target.startsWith("#")) continue;
        try {
          const url = new URL(target, siteUrl);
          if (url.origin === new URL(siteUrl).origin && !/\.[a-z0-9]{2,5}$/i.test(url.pathname)) {
            paths.add(url.pathname.replace(/\/$/, "") || "/");
          }
        } catch { /* A malformed href will be reported as a missing route. */
          paths.add(target);
        }
      }
      visit(child);
    }
  };
  visit(content);
  return [...paths];
}

function allText(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(allText);
  if (typeof value === "object" && value !== null) return Object.values(value).flatMap(allText);
  return [];
}

function missingImageAlts(value: unknown, prefix = ""): string[] {
  if (Array.isArray(value)) return value.flatMap((child, index) => missingImageAlts(child, `${prefix}[${index}]`));
  if (typeof value !== "object" || value === null) return [];
  const fields = value as Record<string, unknown>;
  const missing: string[] = [];
  for (const [key, child] of Object.entries(fields)) {
    if (["featuredImage", "portrait", "image"].includes(key) && typeof child === "string" && child && !fields[`${key}Alt`] && !fields.alt) missing.push(`${prefix}${key}`);
    missing.push(...missingImageAlts(child, `${prefix}${key}.`));
  }
  return missing;
}

/** Checks current CMS content without crawling the public site or external URLs. */
export function analyseSeoHealth({ routes, overrides, contents = [], siteName, siteUrl }: {
  routes: SeoHealthRoute[];
  overrides: Record<string, SeoContent>;
  contents?: SeoHealthContent[];
  siteName: string;
  siteUrl: string;
}): SeoHealthIssue[] {
  const issues: SeoHealthIssue[] = [];
  const routePaths = new Set(routes.map((route) => route.path));
  const titles = new Map<string, string[]>();
  const descriptions = new Map<string, string[]>();
  const labels = new Map(routes.map((route) => [route.path, route.label]));
  const add = (path: string, code: string, severity: SeoHealthIssue["severity"], message: string) => issues.push({ path, label: labels.get(path) ?? path, code, severity, message });
  const remember = (index: Map<string, string[]>, text: string, path: string) => {
    if (!text) return;
    const key = normaliseSeoText(text);
    index.set(key, [...(index.get(key) ?? []), path]);
  };

  for (const route of routes) {
    const override = overrides[route.path] ?? null;
    const text = resolvePageText(route.path, route.defaults, override);
    const title = text.title.trim() ? text.title + titleSuffix(siteName) : "";
    const description = text.description?.trim() ?? "";
    if (!title) add(route.path, "missing-title", "error", "Set a search title for this page.");
    else if (title.length > titleWarnAt) add(route.path, "long-title", "warning", `Search title is ${title.length} characters including the site name; aim for about ${titleWarnAt} or fewer.`);
    if (!description) add(route.path, "missing-description", "warning", "Set a unique search description for this page.");
    else if (description.length > descriptionWarnAt) add(route.path, "long-description", "warning", `Search description is ${description.length} characters; aim for about ${descriptionWarnAt} or fewer.`);
    if (override?.noIndex) add(route.path, "noindex", "info", "This page is intentionally hidden from search and omitted from the sitemap.");
    else { remember(titles, title, route.path); remember(descriptions, description, route.path); }

    if (override?.ogImage && !override.ogImageAlt?.trim()) add(route.path, "share-image-alt", "warning", "Add a description for the shared link image.");
    if (override?.twitterImage && !override.twitterImageAlt?.trim()) add(route.path, "twitter-image-alt", "warning", "Add a description for the X image.");
    if (route.defaults.image?.url && !route.defaults.image.alt?.trim() && !override?.ogImage) add(route.path, "default-image-alt", "warning", "Add alt text to the page's featured image.");
    const custom = validateCustomJsonLd(override?.customJsonLd, route.path, siteUrl);
    if (!custom.ok) add(route.path, "custom-schema", "error", `Custom JSON-LD will be omitted: ${custom.error}`);
    if (override?.canonical) {
      try {
        const canonical = new URL(override.canonical, siteUrl);
        if (canonical.origin === new URL(siteUrl).origin && !routePaths.has(canonical.pathname)) add(route.path, "canonical-target", "error", `Canonical points to an unpublished or unknown page: ${canonical.pathname}.`);
        else if (canonical.href !== new URL(route.path, siteUrl).href) add(route.path, "canonical-elsewhere", "info", "Canonical credits another address; this page is omitted from the sitemap.");
      } catch { add(route.path, "invalid-canonical", "error", "Canonical address is invalid."); }
    }
  }

  for (const [index, field] of [[titles, "title"], [descriptions, "description"]] as const) {
    for (const paths of index.values()) if (paths.length > 1) for (const path of paths) add(path, `duplicate-${field}`, "warning", `Search ${field} is also used by ${paths.filter((entry) => entry !== path).join(", ")}.`);
  }

  const outcome = /\b(?:no ban if accepted|disqualification avoided entirely|guaranteed? (?:acquittal|success|outcome)|100% (?:success|acquittal))\b/i;
  for (const { path, content } of contents) {
    if (!routePaths.has(path)) continue;
    for (const target of internalLinkPaths(content, siteUrl)) if (!routePaths.has(target) && target !== "/share-image") add(path, "broken-internal-link", "error", `Content links to an unpublished or unknown page: ${target}.`);
    for (const field of missingImageAlts(content)) add(path, "content-image-alt", "warning", `Check descriptive alt text for ${field}. Decorative images may use empty alt text intentionally.`);
    const matches = allText(content).filter((text) => outcome.test(text));
    if (matches.length > 0) add(path, "outcome-wording", "warning", `Review wording that may sound like a promised outcome: “${matches[0].slice(0, 180)}”. Explain the court's discretion and individual facts.`);
  }

  // A field may be seen both in metadata and in content; keep each finding once.
  return issues.filter((issue, index) => issues.findIndex((candidate) => candidate.path === issue.path && candidate.code === issue.code && candidate.message === issue.message) === index);
}
