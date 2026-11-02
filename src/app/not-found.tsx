import Link from "next/link";

export default function NotFound() {
  return (
    <section className="relative mx-auto flex min-h-[70vh] w-full max-w-[1920px] flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-7xl font-black tracking-tight text-accent md:text-8xl">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold text-ink md:text-3xl">
        This scene isn&apos;t in the cut
      </h1>
      <p className="mt-3 max-w-md text-sm text-muted md:text-base">
        The page you&apos;re looking for doesn&apos;t exist in the Cinevide Phase 1 demo.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex h-11 items-center justify-center rounded-lg bg-accent px-7 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        Back to Home
      </Link>
    </section>
  );
}
