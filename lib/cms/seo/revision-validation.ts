import "server-only";

import { getSiteSettings } from "@/lib/cms/queries";
import { listSeoMetadataForEditor } from "@/lib/cms/seo/admin-queries";
import { findEditableSeoRoute } from "@/lib/cms/seo/admin-routes";
import { validateSeoContent } from "@/lib/cms/seo/content-validation";
import { validateCustomJsonLd } from "@/lib/cms/seo/custom-json-ld";
import { isCrawlBlocked, noIndexCrawlConflicts, resolvedCrawlSettings, validateCrawlSettings } from "@/lib/cms/seo/robots";
import { listSeoRoutes } from "@/lib/cms/seo/routes";
import { automaticSchemaIds, validateSchemaNodes } from "@/lib/cms/seo/schema-validation";
import { deployment } from "@/lib/site-config";

export async function validateSeoRevision(path: string, content: unknown) {
  if (!(await findEditableSeoRoute(path))) return { ok: false as const, error: "This address is private, unknown or no longer editable. Restore metadata only for a current saved page." };
  const checked = validateSeoContent(content, path, deployment.url);
  if (!checked.ok) return { ok: false as const, error: checked.error };
  const custom = validateCustomJsonLd(checked.content.customJsonLd, path, deployment.url);
  if (custom.ok) {
    const errors = validateSchemaNodes(custom.nodes, automaticSchemaIds(path, deployment.url));
    if (errors.length) return { ok: false as const, error: `This saved structured data needs correction before restore: ${errors.join(" ")}` };
  }
  const settings = await getSiteSettings();
  if (checked.content.noIndex && noIndexCrawlConflicts(resolvedCrawlSettings(settings.robots), [path]).length) return { ok: false as const, error: "This version requests noindex for a crawl-blocked page. Remove its crawl restriction before restoring it." };
  return { ok: true as const, content: checked.content };
}

export async function validateRobotsRevision(value: unknown, confirmedPublicRestrictions = false) {
  const [rows, routes] = await Promise.all([listSeoMetadataForEditor(), listSeoRoutes()]);
  const checked = validateCrawlSettings(value);
  if (!checked.ok) return { ok: false as const, error: checked.error };
  const conflicts = noIndexCrawlConflicts(checked.settings, rows.filter((row) => row.content.noIndex).map((row) => row.path));
  if (conflicts.length) return { ok: false as const, error: `These noindex pages need to stay crawlable: ${conflicts.join(", ")}.` };
  const blocked = routes.filter((route) => checked.settings.rules.some((rule) => isCrawlBlocked(route.path, checked.settings, rule.userAgent)));
  if (blocked.length && !confirmedPublicRestrictions) return { ok: false as const, error: `This version blocks ${blocked.length} public pages for at least one crawler. Review the version and explicitly acknowledge those restrictions before restoring.`, needsConfirmation: true };
  return { ok: true as const, value: checked.settings };
}
