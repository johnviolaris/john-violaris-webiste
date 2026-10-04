import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

import { safeNextPath } from "@/lib/auth-redirect";
import { createClient } from "@/utils/supabase/server";

/**
 * Where Supabase's password-reset email lands.
 *
 * Two shapes of link arrive here:
 *
 *  - `token_hash` and `type=recovery`, from the Reset Password email template
 *    set out in the README. Verified with `verifyOtp`, so it works on any
 *    device, including a phone's mail app opening the link in its own browser.
 *  - `code`, from Supabase's default template, which passes through Supabase's
 *    verify endpoint first. That is the PKCE flow: it only works in the browser
 *    that asked for the email, because the code verifier is a cookie there.
 *
 * Either way a verified link signs the visitor in and sends them on to choose
 * a new password. A stale, used or forged link goes back to the request form,
 * which explains what happened.
 */
const recoveryTypes: EmailOtpType[] = ["recovery"];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"), "/auth/update-password");

  let verified = false;

  try {
    if (tokenHash && type && recoveryTypes.includes(type)) {
      const supabase = await createClient();
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash: tokenHash,
      });

      verified = !error;
    } else if (code) {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      verified = !error;
    }
  } catch {
    // An unavailable auth service is treated like a bad link: no session, and
    // the visitor is told to ask for another.
    verified = false;
  }

  // Outside the try: `redirect` works by throwing.
  redirect(verified ? next : "/auth/forgot-password?error=link");
}
