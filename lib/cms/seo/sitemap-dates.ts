import { findSection } from "@/lib/cms/sections/schema";
import { heroDefaults } from "@/lib/content/pages";
import { resolveSiteConfig, siteSettingKeys, type SiteSettings } from "@/lib/site-config";
import { verifiedPracticeFacts } from "@/lib/cms/settings/practice-facts";
import { belongsInSitemap } from "@/lib/cms/seo/resolve";
import type { SeoContent } from "@/lib/cms/types";

type ModifiedRow = { updated_at: string | null };
export type SitemapDateSources = {
  sections: (ModifiedRow & { page: string; section: string; portrait: string | null })[];
  seo: (ModifiedRow & { path: string })[];
  settings: (ModifiedRow & { key: string; value: unknown })[];
  media: (ModifiedRow & { url: string })[];
  services: ModifiedRow[];
  articles: ModifiedRow[];
  /** Defined (even empty) only after the durable public-date RPC succeeds. */
  publicChanges?: { path: string; modified_at: string | null }[];
  /** Newer schema coverage; old RPC success alone cannot suppress dependency rows. */
  dependencyChanges?: { path: string; modified_at: string | null }[];
};
export type SitemapDatedRoute = { path: string; group: string; lastModified?: string; imageUrl?: string };

/** PostgreSQL timestamptz values, compared as instants rather than strings. */
function timestamp(value: string | null | undefined): number | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return null;
  const parsed = Date.parse(value);
  const calendar = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  if (!Number.isFinite(parsed) || !Number.isFinite(calendar.getTime()) || calendar.toISOString().slice(0, 10) !== value.slice(0, 10) || Number(value.slice(11, 13)) > 23) return null;
  return parsed;
}

/** Actual public source edits only; no build clock or invented default date. */
export function sitemapModificationDates(routes: readonly SitemapDatedRoute[], sources: SitemapDateSources): Map<string, string> {
  const instants = new Map<string, number>();
  const paths = new Set(routes.map((route) => route.path));
  function add(path: string, value: string | null | undefined) {
    const date = timestamp(value);
    if (paths.has(path) && date !== null && date > (instants.get(path) ?? -Infinity)) instants.set(path, date);
  }
  for (const route of routes) add(route.path, route.lastModified);

  const changes = sources.dependencyChanges ?? sources.publicChanges;
  const dependencyPaths = new Set<string>();
  for (const row of changes ?? []) {
    const date = timestamp(row.modified_at);
    // Public watermarks are observed changes, never future publication dates.
    if (date !== null && date <= Date.now()) {
      add(row.path, row.modified_at);
      if (sources.dependencyChanges !== undefined && paths.has(row.path)) dependencyPaths.add(row.path);
    }
  }

  // Once available, watermarks are authoritative for these two source types.
  // Their row updated_at still changes on equal-content upserts; using it here
  // would undo the trigger's no-op protection. Older schemas retain the former
  // current-row behaviour and the private report flags the unavailable source.
  for (const row of changes === undefined ? sources.sections : []) {
    const section = findSection(row.page, row.section);
    if (!section) continue;
    for (const route of routes) {
      // The edited shared CTA is passed only by the home/fixed-page renderers.
      // Contact omits it; blog, service and location renderers use code defaults.
      const wildcard = section.appearsOn.includes("*") && route.group === "Pages" && !["/contact", "/blog"].includes(route.path);
      if (section.appearsOn.includes(route.path) || wildcard) add(route.path, row.updated_at);
    }
  }
  for (const row of changes === undefined ? sources.seo : []) add(row.path, row.updated_at);
  const stored = Object.fromEntries(sources.settings
    .filter((row) => siteSettingKeys.includes(row.key as (typeof siteSettingKeys)[number]) && typeof row.value === "string")
    .map((row) => [row.key, row.value])) as Partial<SiteSettings>;
  const config = resolveSiteConfig(stored);
  const facts = verifiedPracticeFacts(config);
  const globalKeys = new Set(["name", "role", "jurisdiction", "email", "phoneE164", "responseTime", "sraNumber", "qualifiedYear", "reviewSolicitorsUrl", "lawSocietyUrl", "linkedinUrl"]);
  if (config.phoneE164) globalKeys.add("phoneDisplay");
  if (config.whatsappDigits) globalKeys.add("whatsappNumber");
  if (facts) {
    if (facts.practiceLegalName) globalKeys.add("practiceLegalName");
    if (facts.practiceSraNumber) globalKeys.add("practiceSraNumber");
    if (facts.openingHours) globalKeys.add("openingHours");
    if (facts.addressStreet) {
      for (const key of ["addressStreet", "addressLocality", "addressRegion", "addressPostalCode", "addressCountry"] as const) if (facts[key]) globalKeys.add(key);
      if (facts.latitude && facts.longitude) { globalKeys.add("latitude"); globalKeys.add("longitude"); }
    }
    if (globalKeys.has("practiceLegalName") || globalKeys.has("practiceSraNumber") || globalKeys.has("openingHours") || globalKeys.has("addressStreet")) globalKeys.add("practiceDetailsReviewedAt");
  }
  for (const row of sources.settings) {
    if (typeof row.value !== "string") continue;
    // Only settings actually rendered in the shared layout/site JSON-LD date
    // every page. Unverified practice facts and email-only roleLong do not.
    // Static settings are normalised/no-op protected by the new capture. An
    // actual per-path watermark baseline is required before suppressing a row;
    // successful empty/malformed coverage cannot erase surviving evidence.
    // Env-derived contact/practice facts retain their existing row behaviour.
    const covered = ["name", "role", "jurisdiction", "email", "responseTime", "sraNumber", "qualifiedYear", "reviewSolicitorsUrl", "lawSocietyUrl", "linkedinUrl"].includes(row.key);
    if (globalKeys.has(row.key)) for (const route of routes) if (!covered || !dependencyPaths.has(route.path)) add(route.path, row.updated_at);
    if (row.key === "initials" && !dependencyPaths.has("/")) add("/", row.updated_at);
  }
  for (const row of sources.services) {
    if (!dependencyPaths.has("/")) add("/", row.updated_at);
    if (!dependencyPaths.has("/services")) add("/services", row.updated_at);
  }
  for (const row of sources.articles) if (!dependencyPaths.has("/blog")) add("/blog", row.updated_at);

  const savedPortrait = sources.sections.find((row) => row.page === "home" && row.section === "hero")?.portrait;
  const portrait = savedPortrait ?? heroDefaults.portrait;
  const portraitUrl = portrait === "/Profile 7.png" ? "/john-violaris-portrait.webp" : portrait;
  for (const row of sources.media) {
    if (row.url === portraitUrl && !dependencyPaths.has("/")) add("/", row.updated_at);
    for (const route of routes) if (route.imageUrl === row.url && !dependencyPaths.has(route.path)) add(route.path, row.updated_at);
  }
  return new Map([...instants].map(([path, value]) => [path, new Date(value).toISOString()]));
}

/** Dates enrich the existing registry; they can never introduce another URL. */
export function datedSitemapEntries(routes: readonly SitemapDatedRoute[], overrides: Record<string, SeoContent>, siteUrl: string, sources: SitemapDateSources) {
  const dates = sitemapModificationDates(routes, sources);
  return routes.filter((route) => belongsInSitemap(route.path, overrides[route.path] ?? null, siteUrl))
    .map((route) => ({ url: new URL(route.path, siteUrl).href, ...(dates.has(route.path) ? { lastModified: dates.get(route.path)! } : {}) }));
}
