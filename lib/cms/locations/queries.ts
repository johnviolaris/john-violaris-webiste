import "server-only";
import { cache } from "react";
import type { LocationPageContent } from "@/lib/cms/types";
import { publicClient } from "@/utils/supabase/public";

export type PublicLocationPage = {
  slug: string;
  location: string;
  title: string;
  content: LocationPageContent;
  updated_at: string;
};

let reportedUnavailable = false;
function unavailable() {
  if (reportedUnavailable) return;
  reportedUnavailable = true;
  console.warn("[cms] Location pages are unavailable. No location content will be published; apply the location architecture migration before using the editor.");
}

/** No seed or fallback pages: a missing table means no public locations. */
export const getLocationPages = cache(async function getLocationPages(): Promise<PublicLocationPage[]> {
  try {
    const { data, error } = await publicClient().from("location_pages")
      .select("slug,location,title,content,updated_at").eq("published", true)
      .not("reviewed_at", "is", null).order("location").limit(500).returns<PublicLocationPage[]>();
    if (error) { unavailable(); return []; }
    return data ?? [];
  } catch { unavailable(); return []; }
});

export const getLocationPage = cache(async function getLocationPage(slug: string): Promise<PublicLocationPage | null> {
  try {
    const { data, error } = await publicClient().from("location_pages")
      .select("slug,location,title,content,updated_at").eq("slug", slug).eq("published", true)
      .not("reviewed_at", "is", null).maybeSingle<PublicLocationPage>();
    if (error) { unavailable(); return null; }
    return data;
  } catch { unavailable(); return null; }
});
