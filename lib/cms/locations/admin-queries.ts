import "server-only";
import { cache } from "react";
import { createAuthorizedAdminClient } from "@/lib/auth";
import type { LocationPageRow } from "@/lib/cms/types";
import { publicationStatus } from "@/lib/cms/publication";

export const listLocationPagesAdmin = cache(async function listLocationPagesAdmin(): Promise<{ rows: LocationPageRow[]; available: boolean }> {
  const supabase = await createAuthorizedAdminClient();
  const { data, error } = await supabase.from("location_pages").select("*").order("updated_at", { ascending: false }).limit(500).returns<LocationPageRow[]>();
  return { rows: data ?? [], available: !error };
});

export const getLocationPageAdmin = cache(async function getLocationPageAdmin(id: string): Promise<LocationPageRow | null> {
  const supabase = await createAuthorizedAdminClient();
  const { data, error } = await supabase.from("location_pages").select("*").eq("id", id).maybeSingle<LocationPageRow>();
  return error ? null : data;
});

/** Admin-only minimal choices; private draft bodies are never sent to the form. */
export const getLocationChoicesAdmin = cache(async function getLocationChoicesAdmin() {
  const result = await listLocationPagesAdmin();
  return result.rows.map((row) => ({ href: `/locations/${row.slug}`, location: row.location, live: Boolean(row.reviewed_at) && publicationStatus({ published: row.published, published_at: row.published_at ?? null, unpublish_at: row.unpublish_at ?? null }) === "live" }));
});
