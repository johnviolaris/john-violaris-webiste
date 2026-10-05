import "server-only";

import { revalidatePath } from "next/cache";

/**
 * What to rebuild after a content change.
 *
 * The public site is statically rendered, so an edit in the CMS changes nothing
 * a visitor sees until the affected routes are regenerated. Every write action
 * ends with a call to `revalidateFor`, and this file is the single place that
 * decides which routes that means — rather than each section remembering its
 * own list and one of them eventually forgetting `/`.
 *
 * `revalidatePath` is used instead of `revalidateTag` because tagging non-fetch
 * reads needs either `unstable_cache`, deprecated in Next 16, or the Cache
 * Components model, which changes rendering for the whole app. Paths are
 * coarser but they are accurate, and there are not many of them.
 *
 * Note on breadth: the header carries the services mega-menu and the footer
 * carries the contact details, so both render on every page. A change to either
 * genuinely does invalidate the entire site, and `("/", "layout")` says so
 * honestly rather than pretending a narrower list would be correct.
 */

/** Content areas a write can belong to. */
export type ContentEntity =
  | "page-sections"
  | "services"
  | "service-pages"
  | "location-pages"
  | "testimonials"
  | "blog-posts"
  | "blog-categories"
  | "seo-metadata"
  | "site-settings";

/**
 * A path plus how to treat it. `layout` sweeps everything nested beneath the
 * path; `page` rebuilds only that route.
 */
type Target = { path: string; type?: "page" | "layout" };

/**
 * What a caller may pass as an affected route: a path, or a path and how to
 * treat it. A bare string means that one route, which is what nearly every
 * caller wants; the object form is for a change that really does reach every
 * page, such as the closing call to action.
 */
export type RevalidateTarget = string | Target;

/**
 * `app/sitemap.ts` is cached like any static route. It is a route handler
 * rather than a page under a layout, so every entity that adds, removes or
 * re-dates a URL names it outright instead of relying on a layout sweep.
 */
const sitemap: Target = { path: "/sitemap.xml" };

/**
 * Routes each entity appears on, before the row's own path is added.
 *
 * `[]` means the entity has no fixed routes — every affected route depends on
 * the row, and `extraPaths` supplies them.
 */
const targets: Record<ContentEntity, Target[]> = {
  // Keyed by section, and a section knows the routes it renders on — several
  // appear on more than one. The caller passes them, from `appearsOn`.
  "page-sections": [sitemap],
  // In the header mega-menu, so on every page — and each is a sitemap entry.
  services: [{ path: "/", type: "layout" }, sitemap],
  // The catalogue index plus the page itself, which the caller adds. The
  // sitemap dates an offence page by its last edit.
  "service-pages": [{ path: "/services" }, sitemap],
  "location-pages": [sitemap],
  // Homepage only today; the about page shows none.
  testimonials: [{ path: "/" }],
  "blog-posts": [{ path: "/blog" }, sitemap],
  "blog-categories": [{ path: "/blog" }],
  // Keyed by route, so the caller passes the one that changed. Hiding a page
  // from search also takes it out of the sitemap.
  "seo-metadata": [sitemap],
  // Contact details in the header and footer, so on every page — and the name
  // and role on the default share card, which is a route handler of its own.
  "site-settings": [{ path: "/", type: "layout" }, { path: "/share-image" }, sitemap],
};

/** The admin list a section's own writes should refresh. */
const adminSection: Record<ContentEntity, string> = {
  "page-sections": "/admin/website-content",
  services: "/admin/services",
  "service-pages": "/admin/service-pages",
  "location-pages": "/admin/location-pages",
  testimonials: "/admin/testimonials",
  "blog-posts": "/admin/blog-posts",
  "blog-categories": "/admin/blog-categories",
  "seo-metadata": "/admin/seo-metadata",
  "site-settings": "/admin/site-settings",
};

/**
 * Rebuild everything a change to `entity` can affect.
 *
 * `extraPaths` carries the routes only the caller knows — the article whose
 * slug changed, the offence page that was just unpublished. Pass the public
 * path, not the admin one.
 *
 * Both the old and the new path matter on a rename: a slug change leaves the
 * previous URL cached and still serving. Callers renaming a row pass both.
 */
export function revalidateFor(
  entity: ContentEntity,
  extraPaths: RevalidateTarget[] = [],
): void {
  for (const target of targets[entity]) {
    revalidatePath(target.path, target.type);
  }

  for (const extra of extraPaths) {
    if (typeof extra === "string") {
      revalidatePath(extra);
    } else {
      revalidatePath(extra.path, extra.type);
    }
  }

  revalidatePath(adminSection[entity]);
}
