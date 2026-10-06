import "server-only";
import { cache } from "react";
import { getRouteIndex } from "@/lib/cms/queries";
import { publicClient } from "@/utils/supabase/public";
import type { SitemapDateSources } from "@/lib/cms/seo/sitemap-dates";
import type { SitemapDateSnapshot, SitemapUnavailableSource } from "@/lib/cms/seo/sitemap-health";

const emptySources = (): SitemapDateSources => ({ sections: [], seo: [], settings: [], media: [], services: [], articles: [] });

/** Timestamp-only public reads under anon RLS, without draft or audit access. */
export const getSitemapDateSnapshot = cache(async function getSitemapDateSnapshot(): Promise<SitemapDateSnapshot> {
  try {
    const client = publicClient();
    const [sections, seo, settings, media, index] = await Promise.all([
      client.from("page_sections").select("page,section,updated_at,portrait:content->>portrait").returns<SitemapDateSources["sections"]>(),
      client.from("seo_metadata").select("path,updated_at").returns<SitemapDateSources["seo"]>(),
      client.from("site_settings").select("key,value,updated_at").returns<SitemapDateSources["settings"]>(),
      client.from("media_assets").select("url,updated_at").returns<SitemapDateSources["media"]>(),
      getRouteIndex(),
    ]);
    // A failed source supplies no evidence. Other dated sources still work;
    // an older database without the local media migration is supported too.
    const unavailableSources: SitemapUnavailableSource[] = [];
    for (const [name, result] of [["sections", sections], ["seo", seo], ["settings", settings], ["media", media]] as const) {
      if (result.error || result.data === null) unavailableSources.push(name);
    }
    if (!index.sourceAvailable) unavailableSources.push("collections");
    return { sources: {
      sections: sections.error ? [] : sections.data ?? [],
      seo: seo.error ? [] : seo.data ?? [],
      settings: settings.error ? [] : settings.data ?? [],
      media: media.error ? [] : media.data ?? [],
      services: index.services.map(({ updated_at }) => ({ updated_at })),
      articles: index.articles.map(({ updated_at }) => ({ updated_at })),
    }, unavailableSources };
  } catch { return { sources: emptySources(), unavailableSources: ["source-read"] }; }
});

/** Keep the public sitemap's source-only API and failure behaviour unchanged. */
export const getSitemapDateSources = cache(async function getSitemapDateSources(): Promise<SitemapDateSources> {
  return (await getSitemapDateSnapshot()).sources;
});
