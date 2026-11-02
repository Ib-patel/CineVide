import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { SignUpForm } from "@/components/auth/AuthForm";
import { getCurrentSessionUser } from "@/server/auth/session";

export const metadata: Metadata = {
  title: "Cinevide — Create your account",
  description: "Create a Cinevide account to build your watchlist and track what you watch.",
};

export default async function SignUpPage() {
  const user = await getCurrentSessionUser();
  if (user) redirect("/");

  return (
    <main id="main-content" className="relative flex min-h-screen items-center justify-center px-4 py-16">
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-night via-surface to-night" />
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(245,158,11,0.12),transparent_70%)]" />
      <div className="relative z-10 w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <span className="inline-flex size-12 items-center justify-center overflow-hidden rounded-xl bg-accent shadow-lg shadow-accent/40">
            <Image src="/images/branding/logo-mark.svg" alt="" width={34} height={34} />
          </span>
          <h1 className="font-display text-2xl font-bold text-ink">
            Create your Cine<span className="text-accent">vide</span> account
          </h1>
          <p className="text-center text-sm text-muted">
            Your guest watchlist will be waiting for you after sign up.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-card/80 p-6 shadow-2xl backdrop-blur-xl">
          <SignUpForm />
        </div>
        <p className="text-center text-xs text-subtle">
          Demo product — no real payments or media streaming.
        </p>
      </div>
    </main>
  );
}
