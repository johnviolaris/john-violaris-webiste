"use server";

import { redirect } from "next/navigation";

import { hasAdminRole } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";

export type AuthActionState = {
  error: string | null;
  success: boolean;
};

export async function signOut() {
  const supabase = await createClient();

  await supabase.auth.signOut({ scope: "local" });
  redirect("/auth");
}

export async function signIn(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || typeof password !== "string") {
    return { error: "Enter your email address and password.", success: false };
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password) {
    return { error: "Enter your email address and password.", success: false };
  }

  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      return {
        error: "The email address or password is incorrect.",
        success: false,
      };
    }

    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims();

    const userId = claimsData?.claims?.sub;

    if (
      claimsError ||
      !userId ||
      !(await hasAdminRole(supabase, userId))
    ) {
      await supabase.auth.signOut({ scope: "local" });
      return {
        error: "This account is not authorised to access the CMS.",
        success: false,
      };
    }
  } catch {
    return {
      error: "Sign-in is temporarily unavailable. Please try again.",
      success: false,
    };
  }

  redirect("/admin");
}
