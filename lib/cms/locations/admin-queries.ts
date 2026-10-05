import "server-only";
import { cache } from "react";
import { createAuthorizedAdminClient } from "@/lib/auth";
import type { LocationPageRow } from "@/lib/cms/types";

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
