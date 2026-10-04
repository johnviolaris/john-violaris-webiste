"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowLeft, KeyRound, MailCheck } from "lucide-react";

import {
  requestPasswordReset,
  updatePassword,
  type AuthActionState,
  type ResetRequestState,
} from "@/app/auth/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { minimumPasswordLength } from "@/lib/passwords";

const initialRequest: ResetRequestState = { status: "idle", email: "" };
const initialUpdate: AuthActionState = { error: null, success: false };

/** Step one: ask Supabase to email a reset link (`/auth/forgot-password`). */
export function ForgotPasswordForm({ linkFailed }: { linkFailed: boolean }) {
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    initialRequest,
  );
  const sent = state.status === "sent";

  return (
    <Card className="w-full max-w-sm border-navy/10 shadow-xl shadow-navy/8">
      <CardHeader className="gap-4 text-center">
        <div className="mx-auto grid size-11 place-items-center rounded-full bg-navy text-gold">
          {sent ? (
            <MailCheck className="size-5" aria-hidden="true" />
          ) : (
            <KeyRound className="size-5" aria-hidden="true" />
          )}
        </div>
        <div>
          <CardTitle className="font-display text-2xl text-navy">
            {sent ? "Check your email" : "Reset your password"}
          </CardTitle>
          <CardDescription className="mt-1.5">
            {sent ? (
              <>
                If <strong className="text-navy">{state.email}</strong> belongs
                to an admin account, a link to choose a new password is on its
                way.
              </>
            ) : (
              "Enter the email address you sign in with. We will email you a link to choose a new password."
            )}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {sent ? (
          <div
            className="space-y-3 text-sm leading-6 text-muted-foreground"
            aria-live="polite"
          >
            <p>The link works once and expires after an hour.</p>
            <p>
              Nothing after a few minutes? Check your spam folder, then ask
              again.
            </p>
          </div>
        ) : (
          <form action={formAction} className="space-y-4">
            {linkFailed && state.status === "idle" ? (
              <Alert variant="destructive" role="alert">
                <AlertDescription>
                  That link has expired or has already been used. Ask for a
                  new one below.
                </AlertDescription>
              </Alert>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email address</Label>
              <Input
                id="reset-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                autoFocus
                defaultValue={state.email}
                disabled={pending}
                aria-invalid={state.status === "invalid" || undefined}
                aria-describedby={
                  state.status === "invalid" ? "reset-email-error" : undefined
                }
              />
              {state.status === "invalid" ? (
                <p id="reset-email-error" className="text-sm text-destructive">
                  Enter the email address you sign in with.
                </p>
              ) : null}
            </div>
            <Button className="h-10 w-full" type="submit" disabled={pending}>
              {pending ? "Sending…" : "Email me a reset link"}
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link href="/auth">
            <ArrowLeft aria-hidden="true" />
            Back to sign in
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

/** Step two: choose the new password (`/auth/update-password`). */
export function UpdatePasswordForm() {
  const [state, formAction, pending] = useActionState(
    updatePassword,
    initialUpdate,
  );

  return (
    <Card className="w-full max-w-sm border-navy/10 shadow-xl shadow-navy/8">
      <CardHeader className="gap-4 text-center">
        <div className="mx-auto grid size-11 place-items-center rounded-full bg-navy text-gold">
          <KeyRound className="size-5" aria-hidden="true" />
        </div>
        <div>
          <CardTitle className="font-display text-2xl text-navy">
            Choose a new password
          </CardTitle>
          <CardDescription className="mt-1.5">
            Use at least {minimumPasswordLength} characters. Once it is saved,
            you go straight to the dashboard.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={minimumPasswordLength}
              required
              autoFocus
              disabled={pending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">New password, again</Label>
            <Input
              id="confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={minimumPasswordLength}
              required
              disabled={pending}
            />
          </div>
          {state.error ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}
          <Button className="h-10 w-full" type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save new password"}
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link href="/auth/forgot-password">Ask for a new link</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
