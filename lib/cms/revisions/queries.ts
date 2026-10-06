import "server-only";
import { createAuthorizedAdminClient, createAuthorizedSeoClient } from "@/lib/auth";

export type RevisionEntity = "blog_posts" | "service_pages" | "page_sections" | "page_section_drafts" | "site_settings" | "seo_metadata" | "location_pages" | "media_assets" | "services" | "service_groups" | "blog_categories" | "testimonials";
export type ContentRevision = {
  id: string;
  revision_number: number;
  entity_table: RevisionEntity;
  entity_id: string | null;
  entity_key: string;
  operation: "baseline" | "create" | "update" | "delete";
  actor_id: string | null;
  created_at: string;
};

export async function listContentRevisions(entity: RevisionEntity, id: string) {
  const supabase = entity === "seo_metadata" || (entity === "site_settings" && id === "robots")
    ? await createAuthorizedSeoClient() : await createAuthorizedAdminClient();
  let query = supabase.from("content_revisions")
    .select("id,revision_number,entity_table,entity_id,entity_key,operation,actor_id,created_at")
    .eq("entity_table", entity);
  if (id && entity === "seo_metadata") {
    const { data: row } = await supabase.from("seo_metadata").select("id").eq("path", id).maybeSingle<{ id: string }>();
    query = row ? query.eq("entity_id", row.id) : query.eq("entity_key", id);
  } else if (id) query = query.eq("entity_key", id);
  const { data, error } = await query
    .order("revision_number", { ascending: false }).limit(id ? 30 : 100)
    .returns<ContentRevision[]>();
  if (error) {
    return { revisions: [], available: false };
  }
  return { revisions: data ?? [], available: true };
}

export async function getContentRevision(entity: RevisionEntity, entityId: string, revisionId: string) {
  const supabase = await createAuthorizedAdminClient();
  const { data, error } = await supabase.from("content_revisions")
    .select("snapshot").eq("entity_table", entity).eq("entity_key", entityId)
    .eq("id", revisionId).maybeSingle<{ snapshot: unknown }>();
  return !error && data ? data.snapshot : null;
}

export async function getRevisionForComparison(id: string) {
  const supabase = await createAuthorizedSeoClient();
  const { data, error } = await supabase.from("content_revisions")
    .select("id,revision_number,entity_table,entity_id,entity_key,created_at,snapshot")
    .eq("id", id).maybeSingle<ContentRevision & { snapshot: unknown }>();
  return !error ? data : null;
}
