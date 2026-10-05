import "server-only";

import { cache } from "react";
import { createAuthorizedAdminClient, requireSeoEditor } from "@/lib/auth";
import { articleSeoDefaults, findSeoRoute, serviceSeoDefaults, type SeoRoute } from "@/lib/cms/seo/routes";
import type { BlogPostRow, LocationPageRow, ServiceRow } from "@/lib/cms/types";

/** Published defaults are available to SEO editors; draft content stays admin-only. */
export const findEditableSeoRoute = cache(async function findEditableSeoRoute(path: string): Promise<(SeoRoute & { draft?: boolean }) | undefined> {
  const session = await requireSeoEditor();
  const publicRoute = await findSeoRoute(path);
  if (publicRoute) return publicRoute;
  if (session.role !== "admin") return undefined;
  const match = /^\/(blog|services|locations)\/([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(path);
  if (!match) return undefined;
  const [, group, slug] = match;
  const supabase = await createAuthorizedAdminClient();
  if (group === "blog") {
    const { data, error } = await supabase.from("blog_posts").select("*").eq("slug", slug).maybeSingle<BlogPostRow>();
    if (error || !data) return undefined;
    return { path, label: data.title, group: "Articles", defaults: articleSeoDefaults(slug, data.title, data.content.excerpt, data.content.featuredImage, data.content.featuredImageAlt, data.published_at), draft: true };
  }
  if (group === "services") {
    const { data, error } = await supabase.from("services").select("*").eq("slug", slug).maybeSingle<ServiceRow>();
    if (error || !data || data.content.href) return undefined;
    return { path, label: data.name, group: "Services", defaults: serviceSeoDefaults(path, data.name, data.content.intro), draft: true };
  }
  const { data, error } = await supabase.from("location_pages").select("*").eq("slug", slug).maybeSingle<LocationPageRow>();
  if (error || !data) return undefined;
  return { path, label: data.location, group: "Locations", defaults: { title: data.title, description: data.content.description }, draft: true };
});
