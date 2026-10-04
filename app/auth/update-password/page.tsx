import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { UpdatePasswordForm } from "@/app/auth/reset-forms";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = {
  title: "Choose a new password",
  robots: { index: false, follow: false },
};

/**
 * The page a verified reset link lands on. It needs the session
 * `/auth/confirm` just created (or an admin already signed in); without one
 * there is nothing to change, so the visitor is sent to ask for a link.
 */
export default async function UpdatePasswordPage() {
  let signedIn = false;

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();

    signedIn = Boolean(data?.claims?.sub);
  } catch {
    signedIn = false;
  }

  if (!signedIn) redirect("/auth/forgot-password?error=link");

  return (
    <main className="auth-surface grid min-h-svh place-items-center bg-off px-5 py-12">
      <UpdatePasswordForm />
    </main>
  );
}
