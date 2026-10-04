"use client";

import Link from "next/link";
import { useActionState } from "react";
import { House, LockKeyhole } from "lucide-react";

import { signIn, type AuthActionState } from "@/app/auth/actions";
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

const initialState: AuthActionState = { error: null, success: false };

export function AuthForm() {
  return (
    <Card className="w-full max-w-sm border-navy/10 shadow-xl shadow-navy/8">
      <CardHeader className="gap-4 text-center">
        <div className="mx-auto grid size-11 place-items-center rounded-full bg-navy text-gold">
          <LockKeyhole className="size-5" aria-hidden="true" />
        </div>
        <div>
          <CardTitle className="font-display text-2xl text-navy">
            Admin sign in
          </CardTitle>
          <CardDescription className="mt-1.5">
            Sign in with the administrator account provisioned for this
            website.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <SignInForm />
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link href="/">
            <House aria-hidden="true" />
            Back to website
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

function SignInForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <EmailField id="sign-in-email" disabled={pending} autoFocus />
      <PasswordField
        id="sign-in-password"
        autoComplete="current-password"
        disabled={pending}
      />
      <ActionError message={state.error} />
      <Button className="h-10 w-full" type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-center text-sm">
        <Link
          href="/auth/forgot-password"
          className="text-muted-foreground underline-offset-4 hover:text-navy hover:underline"
        >
          Forgot your password?
        </Link>
      </p>
    </form>
  );
}

function EmailField({
  id,
  disabled,
  autoFocus,
}: {
  id: string;
  disabled: boolean;
  autoFocus?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Email address</Label>
      <Input
        id={id}
        name="email"
        type="email"
        autoComplete="email"
        required
        autoFocus={autoFocus}
        disabled={disabled}
      />
    </div>
  );
}

function PasswordField({
  id,
  disabled,
}: {
  id: string;
  autoComplete: "current-password";
  disabled: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Password</Label>
      <Input
        id={id}
        name="password"
        type="password"
        autoComplete="current-password"
        required
        disabled={disabled}
      />
    </div>
  );
}

function ActionError({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <Alert variant="destructive" role="alert">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
