import "server-only";
import { cache } from "react";
import { getRouteIndex } from "@/lib/cms/queries";
import { publicClient } from "@/utils/supabase/public";
import type { SitemapDateSources } from "@/lib/cms/seo/sitemap-dates";

const emptySources = (): SitemapDateSources => ({ sections: [], seo: [], settings: [], media: [], services: [], articles: [] });

/** Timestamp-only public reads under anon RLS, without draft or audit access. */
export const getSitemapDateSources = cache(async function getSitemapDateSources(): Promise<SitemapDateSources> {
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
    return {
      sections: sections.error ? [] : sections.data ?? [],
      seo: seo.error ? [] : seo.data ?? [],
      settings: settings.error ? [] : settings.data ?? [],
      media: media.error ? [] : media.data ?? [],
      services: index.services.map(({ updated_at }) => ({ updated_at })),
      articles: index.articles.map(({ updated_at }) => ({ updated_at })),
    };
  } catch { return emptySources(); }
});
