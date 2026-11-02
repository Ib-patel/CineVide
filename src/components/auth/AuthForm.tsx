"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Lock, Mail, UserRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { signInAction, signUpAction } from "@/app/auth/actions";
import { initialActionState, type ActionState } from "@/app/auth/action-states";

export function SignInForm() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    signInAction,
    initialActionState
  );

  return (
    <form action={formAction} className="space-y-4" noValidate={false}>
      {state.error ? (
        <p role="alert" className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-ink">
          {state.error}
        </p>
      ) : null}
      <label className="block space-y-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">Email</span>
        <span className="relative block">
          <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" aria-hidden />
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            className="h-10 w-full rounded-lg border border-white/15 bg-white/5 pl-9 pr-3 text-sm text-ink placeholder:text-subtle focus-visible:border-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          />
        </span>
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">Password</span>
        <span className="relative block">
          <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" aria-hidden />
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="h-10 w-full rounded-lg border border-white/15 bg-white/5 pl-9 pr-3 text-sm text-ink placeholder:text-subtle focus-visible:border-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          />
        </span>
      </label>
      <Button type="submit" size="lg" className="w-full cursor-pointer" disabled={isPending}>
        {isPending ? <Spinner className="size-4" aria-hidden /> : null}
        {isPending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-center text-sm text-muted">
        New to Cinevide?{" "}
        <Link href="/signup" className="cursor-pointer font-semibold text-gold hover:text-gold/80">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function SignUpForm() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    signUpAction,
    initialActionState
  );

  return (
    <form action={formAction} className="space-y-4" noValidate={false}>
      {state.error ? (
        <p role="alert" className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-ink">
          {state.error}
        </p>
      ) : null}
      <label className="block space-y-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">Name</span>
        <span className="relative block">
          <UserRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" aria-hidden />
          <input
            type="text"
            name="name"
            autoComplete="name"
            required
            placeholder="Ishan"
            className="h-10 w-full rounded-lg border border-white/15 bg-white/5 pl-9 pr-3 text-sm text-ink placeholder:text-subtle focus-visible:border-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          />
        </span>
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">Email</span>
        <span className="relative block">
          <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" aria-hidden />
          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            className="h-10 w-full rounded-lg border border-white/15 bg-white/5 pl-9 pr-3 text-sm text-ink placeholder:text-subtle focus-visible:border-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          />
        </span>
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">Password</span>
        <span className="relative block">
          <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" aria-hidden />
          <input
            type="password"
            name="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="At least 8 characters"
            className="h-10 w-full rounded-lg border border-white/15 bg-white/5 pl-9 pr-3 text-sm text-ink placeholder:text-subtle focus-visible:border-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          />
        </span>
      </label>
      <Button type="submit" size="lg" className="w-full cursor-pointer" disabled={isPending}>
        {isPending ? <Spinner className="size-4" aria-hidden /> : null}
        {isPending ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/signin" className="cursor-pointer font-semibold text-gold hover:text-gold/80">
          Sign in
        </Link>
      </p>
    </form>
  );
}
