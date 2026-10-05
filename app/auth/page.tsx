import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthForm } from "@/app/auth/auth-form";
import { getCmsSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default async function AuthPage() {
  const admin = await getCmsSession();

  if (admin) redirect("/admin");

  return (
    <main className="auth-surface grid min-h-svh place-items-center bg-off px-5 py-12">
      <AuthForm />
    </main>
  );
}
