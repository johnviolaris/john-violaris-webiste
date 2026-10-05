import "server-only";
import { cache } from "react";
import { createAuthorizedAdminClient } from "@/lib/auth";
import { publicClient } from "@/utils/supabase/public";
import type { MediaAsset } from "@/lib/cms/media/schema";

export const mediaSelect = "id,url,storage_path,filename,mime_type,width,height,alt_text,is_decorative,title,caption,caption_format";
export async function listMediaAssets() {
  const client = await createAuthorizedAdminClient();
  const { data, error } = await client.from("media_assets").select(mediaSelect).order("created_at", { ascending: false }).limit(500).returns<MediaAsset[]>();
  return { assets: data ?? [], available: !error };
}
export async function getMediaAsset(id: string) {
  const client = await createAuthorizedAdminClient();
  const { data } = await client.from("media_assets").select(mediaSelect).eq("id", id).maybeSingle<MediaAsset>();
  return data;
}
export async function getMediaAssetForUrl(url: string) {
  const client = await createAuthorizedAdminClient();
  const { data } = await client.from("media_assets").select(mediaSelect).eq("url", url).maybeSingle<MediaAsset>();
  return data;
}
/** An old database keeps its existing per-use descriptions until migration. */
export const getPublicMedia = cache(async function getPublicMedia(): Promise<Map<string, MediaAsset>> {
  try {
    const { data, error } = await publicClient().from("media_assets").select(mediaSelect).limit(500).returns<MediaAsset[]>();
    return new Map(!error ? (data ?? []).map((asset) => [asset.url, asset]) : []);
  } catch { return new Map(); }
});
