import { SeoForm } from "@/components/admin/seo-form";
import { requireSeoEditor } from "@/lib/auth";
import { RevisionHistory } from "@/components/admin/revision-history";
import { getSeoRowForEditor, listSeoMetadataForEditor } from "@/lib/cms/seo/admin-queries";
import { findEditableSeoRoute } from "@/lib/cms/seo/admin-routes";
import { getSiteConfig } from "@/lib/cms/queries";
import { defaultShareImage, resolvePageText, titleSuffix } from "@/lib/cms/seo/resolve";
import { listSeoRoutes } from "@/lib/cms/seo/routes";
import { seoValuesFrom } from "@/lib/cms/seo/schema";
import { deployment } from "@/lib/site-config";

/** Separate form beside the content form, so each explicit save has one clear owner. */
export async function SeoPanel({ path }: { path: string }) {
  const session = await requireSeoEditor();
  const [route, row, rows, routes, config] = await Promise.all([findEditableSeoRoute(path), getSeoRowForEditor(path), listSeoMetadataForEditor(), listSeoRoutes(), getSiteConfig()]);
  if (!route) return null;
  const overrides = new Map(rows.map((entry) => [entry.path, entry.content]));
  const comparisonPages = routes.filter((entry) => entry.path !== path && !overrides.get(entry.path)?.noIndex).map((entry) => {
    const text = resolvePageText(entry.path, entry.defaults, overrides.get(entry.path) ?? null);
    return { path: entry.path, title: text.title + titleSuffix(config.name), description: text.description ?? "" };
  });
  return <details className="my-6 rounded-xl border"><summary className="cursor-pointer px-4 py-3 font-display text-lg font-semibold">SEO and social sharing<span className="mt-1 block font-sans text-xs font-normal text-muted-foreground">{path} · {row ? "Customised" : "Page defaults"}{route.draft ? " · Private saved draft" : ""}</span></summary><div className="border-t p-4 md:p-5"><p className="mb-5 text-sm text-muted-foreground">Search metadata saves separately from the page content. This panel and SEO Metadata edit the same settings. Save changes to the page’s URL before editing its metadata. The visible heading is edited in the content form above.</p><SeoForm key={path} path={path} label={route.label} url={new URL(path, deployment.url).href} defaults={route.defaults} values={seoValuesFrom(row?.content ?? null)} noIndex={row?.content.noIndex === true} noFollow={row?.content.noFollow === true} customised={Boolean(row)} suffix={titleSuffix(config.name)} fallbackImage={defaultShareImage(config.name, config.role).url} comparisonPages={comparisonPages} draft={route.draft} canManageMedia={session.role === "admin"} />{row ? <RevisionHistory entity="seo_metadata" id={path} /> : null}</div></details>;
}
