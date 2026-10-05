import "server-only";

import { cache } from "react";
import { permanentRedirect, redirect } from "next/navigation";

import { publicClient } from "@/utils/supabase/public";
import { isPublicRedirectPath, isSameSitePath } from "@/lib/cms/redirect-rules";

export { isSameSitePath } from "@/lib/cms/redirect-rules";

export type CmsRedirect = {
  destinationPath: string;
  permanent: boolean;
};

/**
 * Only relative, same-site paths may enter or leave the redirect store.
 *
 * The database enforces the same boundary. Keeping the check here as well
 * means malformed legacy data can never become an open redirect if it was
 * inserted outside the application.
 */
/** One active redirect, or null when the requested path is still canonical. */
export const getCmsRedirect = cache(async function getCmsRedirect(
  sourcePath: string,
): Promise<CmsRedirect | null> {
  if (!isSameSitePath(sourcePath)) return null;

  try {
    const { data, error } = await publicClient()
      .from("redirects")
      .select("destination_path, permanent")
      .eq("source_path", sourcePath)
      .eq("active", true)
      .maybeSingle<{ destination_path: string; permanent: boolean }>();

    if (error) throw error;
    if (
      !data ||
      data.destination_path === sourcePath ||
      !isPublicRedirectPath(data.destination_path)
    ) {
      return null;
    }

    return {
      destinationPath: data.destination_path,
      permanent: data.permanent,
    };
  } catch (error) {
    // Redirects enhance missing-route handling. A database outage should still
    // produce the honest 404 rather than turn every unknown URL into a 500.
    console.error(`[cms] Redirect for "${sourcePath}" could not be resolved`, error);

    return null;
  }
});

/**
 * Resolve a stored redirect from a dynamic route immediately before its 404.
 * Automatic slug-history rows are permanent (308); the table also supports a
 * temporary redirect for a future manual CMS editor.
 */
export async function redirectFromCms(sourcePath: string): Promise<void> {
  const match = await getCmsRedirect(sourcePath);

  if (!match) return;

  if (match.permanent) {
    permanentRedirect(match.destinationPath);
  }

  redirect(match.destinationPath);
}

