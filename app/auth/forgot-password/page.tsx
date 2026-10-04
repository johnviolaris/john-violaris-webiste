import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/app/auth/reset-forms";

export const metadata: Metadata = {
  title: "Reset your password",
  robots: { index: false, follow: false },
};

/**
 * Where "Forgot your password?" leads, and where `/auth/confirm` sends a
 * visitor whose link did not verify (`?error=link`).
 */
export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="auth-surface grid min-h-svh place-items-center bg-off px-5 py-12">
      <ForgotPasswordForm linkFailed={error === "link"} />
    </main>
  );
}
