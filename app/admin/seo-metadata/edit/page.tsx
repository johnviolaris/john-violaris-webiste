import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireSeoEditor } from "@/lib/auth";

import { SeoForm } from "@/components/admin/seo-form";
import { RevisionHistory } from "@/components/admin/revision-history";
import { getSeoRowForEditor as getSeoRow, listSeoMetadataForEditor as listSeoMetadata } from "@/lib/cms/seo/admin-queries";
import { getSiteConfig } from "@/lib/cms/queries";
import { defaultShareImage, resolvePageText, titleSuffix } from "@/lib/cms/seo/resolve";
import { listSeoRoutes } from "@/lib/cms/seo/routes";
import { findEditableSeoRoute as findSeoRoute } from "@/lib/cms/seo/admin-routes";
import { seoValuesFrom } from "@/lib/cms/seo/schema";
import { formatUkShortDateTime } from "@/lib/format";
import { deployment } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Edit SEO",
};

/**
 * One page's SEO, addressed by its path in the query string.
 *
 * A query parameter rather than a route segment, because the thing being
 * edited is itself a path — `/services/drink-driving` — and nesting that under
 * `/admin/seo-metadata/` would make the home page's `/` unaddressable.
 */
export default async function EditSeoPage({
  searchParams,
}: {
  searchParams: Promise<{ path?: string | string[] }>;
}) {
  const { path: raw } = await searchParams;
  const path = typeof raw === "string" ? raw : "";
  const session = await requireSeoEditor();

  const [route, row, config, routes, rows] = await Promise.all([
    findSeoRoute(path),
    getSeoRow(path),
    getSiteConfig(),
    listSeoRoutes(),
    listSeoMetadata(),
  ]);

  if (!route) notFound();

  const content = row?.content ?? null;
  const overrides = new Map(rows.map((entry) => [entry.path, entry.content]));
  const comparisonPages = routes.filter((entry) => entry.path !== path && !overrides.get(entry.path)?.noIndex).map((entry) => {
    const text = resolvePageText(entry.path, entry.defaults, overrides.get(entry.path) ?? null);
    return { path: entry.path, title: text.title + titleSuffix(config.name), description: text.description ?? "" };
  });

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-14 pb-12 md:px-8 md:pt-10">
      <header className="mb-6">
        <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">
          SEO · {route.group}
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold">
          {route.label}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          <span className="font-mono">{route.path}</span>
          {route.draft ? " · Private saved draft" : null}
          {" · "}
          {row ? (
            <>
              Customised, last saved{" "}
              <time dateTime={row.updated_at}>
                {formatUkShortDateTime(row.updated_at)}
              </time>
              .
            </>
          ) : (
            "Using the page’s defaults."
          )}
        </p>
      </header>

      <SeoForm
        // Keyed by path so moving between two pages rebuilds the editor rather
        // than carrying one page's typing into the next.
        key={route.path}
        path={route.path}
        label={route.label}
        url={new URL(route.path, deployment.url).href}
        defaults={route.defaults}
        values={seoValuesFrom(content)}
        noIndex={content?.noIndex === true}
        noFollow={content?.noFollow === true}
        customised={Boolean(row)}
        suffix={titleSuffix(config.name)}
        fallbackImage={defaultShareImage(config.name, config.role).url}
        comparisonPages={comparisonPages}
        draft={route.draft}
        canManageMedia={session.role === "admin"}
      />
      {row ? <RevisionHistory entity="seo_metadata" id={path} /> : null}
    </div>
  );
}
