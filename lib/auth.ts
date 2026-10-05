import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { createClient } from "@/utils/supabase/server";
import { cmsRole } from "@/lib/cms/permissions";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export async function hasAdminRole(
  supabase: SupabaseServerClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  return !error && data?.role === "admin";
}

export async function hasCmsRole(supabase: SupabaseServerClient, userId: string) {
  const { data, error } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  return !error && cmsRole(data?.role) !== null;
}

export const getCmsSession = cache(async () => {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) {
    return null;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getClaims();
    const claims = data?.claims;

    if (error || !claims?.sub) return null;
    const { data: profile, error: profileError } = await supabase.from("profiles")
      .select("role").eq("id", claims.sub).maybeSingle();
    const role = cmsRole(profile?.role);
    if (profileError || !role) return null;

    return {
      userId: claims.sub,
      role,
      email: typeof claims.email === "string" ? claims.email : null,
    };
  } catch {
    // A missing or unavailable auth service must fail closed. The sign-in page
    // can still render and protected reads never receive a client.
    return null;
  }
});

export const getAdminSession = cache(async () => {
  const session = await getCmsSession();
  return session?.role === "admin" ? session : null;
});

export async function requireCmsSession() {
  const session = await getCmsSession();
  if (!session) redirect("/auth");
  return session;
}

export async function requireSeoEditor() {
  return requireCmsSession();
}

export async function createAuthorizedSeoClient() {
  await requireSeoEditor();
  return createClient();
}

export async function requireAdmin() {
  const session = await getAdminSession();

  if (!session) redirect("/auth");

  return session;
}

/**
 * A cookie-backed Supabase client that is only returned after the caller's
 * current session has been verified as an administrator.
 *
 * Admin layouts are useful for the shared shell, but Next.js can render a
 * layout and its child page in parallel. Keeping this check beside every
 * protected read means a child can never start its query while the layout is
 * still deciding whether to redirect.
 */
export async function createAuthorizedAdminClient() {
  await requireAdmin();

  return createClient();
}
