import type { MetadataRoute } from "next";

export const privateCrawlPaths = ["/admin", "/auth", "/api", "/preview"] as const;
export const robotsRulesMaxLength = 8_000;

export type CrawlRule = {
  userAgent: string;
  allow: string[];
  disallow: string[];
};
export type CrawlSettings = { rules: CrawlRule[] };
export const defaultCrawlSettings: CrawlSettings = {
  rules: [{ userAgent: "*", allow: ["/"], disallow: [] }],
};

type Validation = { ok: true; settings: CrawlSettings } | { ok: false; error: string };
const list = (value: unknown) => typeof value === "string" ? [value] : Array.isArray(value) ? value : null;

/** Accept only the supported crawl fields; never interpolate arbitrary directives. */
export function validateCrawlSettings(value: unknown): Validation {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, error: "Use an object containing a rules list." };
  try { if (JSON.stringify(value).length > robotsRulesMaxLength) return { ok: false, error: "Keep crawl rules within 8,000 characters." }; }
  catch { return { ok: false, error: "Crawl rules must be a plain JSON object." }; }
  const record = value as Record<string, unknown>;
  if (Object.keys(record).some((key) => key !== "rules")) return { ok: false, error: "Only rules may be set here. The canonical sitemap is managed automatically." };
  if (!Array.isArray(record.rules) || record.rules.length === 0 || record.rules.length > 12) return { ok: false, error: "Add between one and twelve crawler rules." };
  const rules: CrawlRule[] = [];
  const agents = new Set<string>();
  for (const [index, item] of record.rules.entries()) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return { ok: false, error: `Rule ${index + 1} must be an object.` };
    const rule = item as Record<string, unknown>;
    if (Object.keys(rule).some((key) => !["userAgent", "allow", "disallow"].includes(key))) return { ok: false, error: `Rule ${index + 1} supports userAgent, allow and disallow only.` };
    const userAgent = typeof rule.userAgent === "string" ? rule.userAgent.trim() : "";
    if (!/^(?:\*|[A-Za-z][A-Za-z0-9_-]{0,79})$/.test(userAgent)) return { ok: false, error: `Rule ${index + 1} needs * or a crawler name such as Googlebot.` };
    if (agents.has(userAgent.toLowerCase())) return { ok: false, error: `Use one rule per crawler: ${userAgent} appears twice.` };
    agents.add(userAgent.toLowerCase());
    const paths: { allow: string[]; disallow: string[] } = { allow: [], disallow: [] };
    for (const field of ["allow", "disallow"] as const) {
      const supplied = rule[field] === undefined ? [] : list(rule[field]);
      if (!supplied || supplied.length > 50) return { ok: false, error: `Rule ${index + 1}: ${field} must contain up to fifty paths.` };
      for (const path of supplied) {
        if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//") || path.length > 250 || /[\s\u0000-\u001f\u007f#\\]/.test(path)) return { ok: false, error: `Rule ${index + 1}: use paths starting with /, without whitespace, fragments or full URLs.` };
        if (field === "allow" && path.includes("*")) return { ok: false, error: "Use explicit Allow paths. Wildcards are supported for Disallow rules only, so private-route protections cannot be overridden." };
        if (field === "allow" && privateCrawlPaths.some((prefix) => path.toLowerCase().startsWith(prefix))) return { ok: false, error: `Private routes such as ${path} cannot be allowed.` };
        paths[field].push(path);
      }
      paths[field] = [...new Set(paths[field])];
    }
    rules.push({ userAgent, ...paths });
  }
  if (!agents.has("*")) return { ok: false, error: "Include a * rule so other crawlers keep an explicit default." };
  return { ok: true, settings: { rules } };
}

export function parseCrawlSettings(raw: string): Validation {
  if (!raw.trim()) return { ok: true, settings: defaultCrawlSettings };
  if (raw.length > robotsRulesMaxLength) return { ok: false, error: "Keep crawl rules within 8,000 characters." };
  try { return validateCrawlSettings(JSON.parse(raw)); }
  catch { return { ok: false, error: "The JSON cannot be read. Check commas, brackets and quoted strings." }; }
}

/** Fail safely to the normal public defaults after an invalid legacy/manual edit. */
export function resolvedCrawlSettings(value: unknown): CrawlSettings {
  const checked = validateCrawlSettings(value);
  return checked.ok ? checked.settings : defaultCrawlSettings;
}

function matches(pattern: string, path: string): boolean {
  const end = pattern.endsWith("$");
  const rule = end ? pattern.slice(0, -1) : `${pattern}*`;
  let targetIndex = 0;
  let ruleIndex = 0;
  let star = -1;
  let retry = 0;
  // Greedy wildcard matching avoids exponential backtracking on hostile patterns.
  while (targetIndex < path.length) {
    if (rule[ruleIndex] === path[targetIndex]) { ruleIndex++; targetIndex++; }
    else if (rule[ruleIndex] === "*") { star = ruleIndex++; retry = targetIndex; }
    else if (star >= 0) { ruleIndex = star + 1; targetIndex = ++retry; }
    else return false;
  }
  while (rule[ruleIndex] === "*") ruleIndex++;
  return ruleIndex === rule.length;
}

/** Most-specific matching path wins; Allow wins an equal-length tie. */
export function isCrawlBlocked(path: string, settings: CrawlSettings, userAgent = "*"): boolean {
  const rule = settings.rules.find((item) => item.userAgent.toLowerCase() === userAgent.toLowerCase()) ?? settings.rules.find((item) => item.userAgent === "*");
  if (!rule) return false;
  const allow = Math.max(-1, ...rule.allow.filter((pattern) => matches(pattern, path)).map((pattern) => pattern.replace(/\*/g, "").length));
  const deny = Math.max(-1, ...[...rule.disallow, ...privateCrawlPaths].filter((pattern) => matches(pattern, path)).map((pattern) => pattern.replace(/\*/g, "").length));
  return deny > allow;
}

export function crawlFile(settings: CrawlSettings, siteUrl: string): MetadataRoute.Robots {
  return {
    rules: settings.rules.map((rule) => ({
      userAgent: rule.userAgent,
      ...(rule.allow.length ? { allow: rule.allow } : {}),
      disallow: [...new Set([...privateCrawlPaths, ...rule.disallow])],
    })),
    sitemap: new URL("/sitemap.xml", siteUrl).href,
  };
}

/** A noindex page must remain fetchable for a crawler to read that directive. */
export function noIndexCrawlConflicts(settings: CrawlSettings, paths: string[]): string[] {
  return paths.filter((path) => !privateCrawlPaths.some((prefix) => path.startsWith(prefix)) && settings.rules.some((rule) => isCrawlBlocked(path, settings, rule.userAgent)));
}

export function crawlPreview(settings: CrawlSettings, siteUrl: string): string {
  const lines = settings.rules.flatMap((rule) => [
    `User-Agent: ${rule.userAgent}`,
    ...rule.allow.map((path) => `Allow: ${path}`),
    ...[...new Set([...privateCrawlPaths, ...rule.disallow])].map((path) => `Disallow: ${path}`),
    "",
  ]);
  return [...lines, `Sitemap: ${new URL("/sitemap.xml", siteUrl).href}`, ""].join("\n");
}
