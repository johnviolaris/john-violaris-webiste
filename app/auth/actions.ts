"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { hasAdminRole } from "@/lib/auth";
import { minimumPasswordLength } from "@/lib/passwords";
import { deployment } from "@/lib/site-config";
import { createClient } from "@/utils/supabase/server";

export type AuthActionState = {
  error: string | null;
  success: boolean;
};

export type ResetRequestState = {
  status: "idle" | "sent" | "invalid";
  email: string;
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

/**
 * Step one of Supabase's password recovery: ask it to email a reset link.
 *
 * The answer is the same whatever happens. Supabase already returns success
 * for an address with no account; if this action then reported a failure for
 * a real one (a rate limit, a mail server refusing), anyone could tell which
 * addresses are admin accounts. Failures are logged for the developer instead.
 *
 * The link is built by the Reset Password email template, from Supabase's Site
 * URL. `redirectTo` matters only for the default template, whose link returns
 * through Supabase to this address, and Supabase honours it only when it is in
 * the project's Redirect URLs.
 */
export async function requestPasswordReset(
  _previousState: ResetRequestState,
  formData: FormData,
): Promise<ResetRequestState> {
  const value = formData.get("email");
  const email = typeof value === "string" ? value.trim().toLowerCase() : "";

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: "invalid", email };
  }

  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host?.startsWith("localhost") ? "http" : "https");
  const origin = host ? `${protocol}://${host}` : deployment.url;

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/confirm?next=/auth/update-password`,
    });

    if (error) {
      console.error(
        "Password reset email could not be sent:",
        error.code ?? error.message,
      );
    }
  } catch (error) {
    console.error("Password reset is unavailable:", error);
  }

  return { status: "sent", email };
}

/**
 * Step two: the visitor arrived from the emailed link, so `/auth/confirm` has
 * signed them in, and this sets the password they choose. An admin who is
 * already signed in can use the same page to change theirs.
 *
 * Other sessions are signed out afterwards, so a reset after a lost or stolen
 * password also ends any session the old password opened.
 */
export async function updatePassword(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");

  if (typeof password !== "string" || typeof confirmPassword !== "string") {
    return { error: "Enter your new password twice.", success: false };
  }

  if (password.length < minimumPasswordLength) {
    return {
      error: `Choose a password with at least ${minimumPasswordLength} characters.`,
      success: false,
    };
  }

  if (password !== confirmPassword) {
    return { error: "The two passwords do not match.", success: false };
  }

  const expired = {
    error: "This reset link has expired. Ask for a new one.",
    success: false,
  };

  try {
    const supabase = await createClient();
    const { data: claimsData } = await supabase.auth.getClaims();

    if (!claimsData?.claims?.sub) return expired;

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      switch (error.code) {
        case "same_password":
          return {
            error: "Choose a password different from your current one.",
            success: false,
          };
        case "weak_password":
          return {
            error:
              "That password is too easy to guess, or has appeared in a data breach. Choose another.",
            success: false,
          };
        case "session_not_found":
        case "session_expired":
          return expired;
        default:
          console.error("Password could not be changed:", error.code ?? error.message);
          return {
            error: "Your password could not be changed. Please try again.",
            success: false,
          };
      }
    }

    // The password has changed by now; failing to end other sessions must not
    // report the change itself as failed.
    await supabase.auth.signOut({ scope: "others" }).catch(() => undefined);
  } catch {
    return {
      error: "Password changes are temporarily unavailable. Please try again.",
      success: false,
    };
  }

  redirect("/admin");
}
