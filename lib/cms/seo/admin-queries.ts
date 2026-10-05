import "server-only";

import { cache } from "react";
import { createAuthorizedSeoClient } from "@/lib/auth";
import type { SeoRow } from "@/lib/cms/types";

export const listSeoMetadataForEditor = cache(async function listSeoMetadataForEditor(): Promise<SeoRow[]> {
  const supabase = await createAuthorizedSeoClient();
  const { data, error } = await supabase.from("seo_metadata").select("*").order("path").limit(500).returns<SeoRow[]>();
  if (error) { console.error("[cms] Failed to load SEO settings", error); return []; }
  return data ?? [];
});

export const getSeoRowForEditor = cache(async function getSeoRowForEditor(path: string): Promise<SeoRow | null> {
  const supabase = await createAuthorizedSeoClient();
  const { data, error } = await supabase.from("seo_metadata").select("*").eq("path", path).maybeSingle<SeoRow>();
  if (error) { console.error("[cms] Failed to load route SEO settings", error); return null; }
  return data;
});

export const getRobotsForEditor = cache(async function getRobotsForEditor(): Promise<unknown> {
  const supabase = await createAuthorizedSeoClient();
  const { data, error } = await supabase.from("site_settings").select("value").eq("key", "robots").maybeSingle<{ value: unknown }>();
  if (error) { console.error("[cms] Failed to load crawl rules", error); return null; }
  return data?.value ?? null;
});
