export default function Loading() {
  return (
    <div className="flex min-h-[70vh] w-full flex-col items-center justify-center gap-4 bg-night">
      <span
        aria-hidden
        className="inline-block size-12 animate-spin rounded-full border-2 border-white/10 border-t-accent"
      />
      <p className="text-sm font-medium text-muted" role="status">
        Loading Cinevide…
      </p>
    </div>
  );
}
