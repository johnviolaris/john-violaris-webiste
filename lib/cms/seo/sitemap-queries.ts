import "server-only";
import { cache } from "react";
import { getRouteIndex } from "@/lib/cms/queries";
import { publicClient } from "@/utils/supabase/public";
import type { SitemapDateSources } from "@/lib/cms/seo/sitemap-dates";
import type { SitemapDateSnapshot, SitemapUnavailableSource } from "@/lib/cms/seo/sitemap-health";

const emptySources = (): SitemapDateSources => ({ sections: [], seo: [], settings: [], media: [], services: [], articles: [] });

/** Public sources and a date-only RPC, without draft or audit access. */
export const getSitemapDateSnapshot = cache(async function getSitemapDateSnapshot(): Promise<SitemapDateSnapshot> {
  try {
    const client = publicClient();
    // A missing/failed new RPC must not discard the older surviving sources.
    const readDates = async (name: string): Promise<{ data: NonNullable<SitemapDateSources["publicChanges"]> | null; error: boolean }> => {
      try {
        const { data, error } = await client.rpc(name);
        if (error || !Array.isArray(data) || data.some((row) => !row || typeof row.path !== "string" || typeof row.modified_at !== "string")) return { data: null, error: true };
        return { data: data.map((row) => ({ path: row.path, modified_at: row.modified_at })), error: false };
      } catch { return { data: null, error: true }; }
    };
    const durableDates = async () => {
      const dependencies = await readDates("get_sitemap_dependency_dates");
      if (!dependencies.error && dependencies.data !== null) return { ...dependencies, dependencies: true, dependencyUnavailable: false };
      return { ...await readDates("get_sitemap_change_dates"), dependencies: false, dependencyUnavailable: true };
    };
    const [sections, seo, settings, media, index, changes] = await Promise.all([
      client.from("page_sections").select("page,section,updated_at,portrait:content->>portrait").returns<SitemapDateSources["sections"]>(),
      client.from("seo_metadata").select("path,updated_at").returns<SitemapDateSources["seo"]>(),
      client.from("site_settings").select("key,value,updated_at").returns<SitemapDateSources["settings"]>(),
      client.from("media_assets").select("url,updated_at").returns<SitemapDateSources["media"]>(),
      getRouteIndex(),
      durableDates(),
    ]);
    // A failed source supplies no evidence. Other dated sources still work;
    // an older database without the local media migration is supported too.
    const unavailableSources: SitemapUnavailableSource[] = [];
    for (const [name, result] of [["sections", sections], ["seo", seo], ["settings", settings], ["media", media]] as const) {
      if (result.error || result.data === null) unavailableSources.push(name);
    }
    if (!index.sourceAvailable) unavailableSources.push("collections");
    if (changes.error || changes.data === null) unavailableSources.push("public-changes");
    if (changes.dependencyUnavailable) unavailableSources.push("dependency-changes");
    return { sources: {
      sections: sections.error ? [] : sections.data ?? [],
      seo: seo.error ? [] : seo.data ?? [],
      settings: settings.error ? [] : settings.data ?? [],
      media: media.error ? [] : media.data ?? [],
      services: index.services.map(({ updated_at }) => ({ updated_at })),
      articles: index.articles.map(({ updated_at }) => ({ updated_at })),
      ...(!changes.error && changes.data !== null ? changes.dependencies ? { dependencyChanges: changes.data } : { publicChanges: changes.data } : {}),
    }, unavailableSources };
  } catch { return { sources: emptySources(), unavailableSources: ["source-read"] }; }
});

/** Keep the public sitemap's source-only API and failure behaviour unchanged. */
export const getSitemapDateSources = cache(async function getSitemapDateSources(): Promise<SitemapDateSources> {
  return (await getSitemapDateSnapshot()).sources;
});
