/**
 * Route skeleton shaped like the real page (hero + rows), so content appears to
 * "develop" in place rather than replacing a spinner — it reads as faster.
 */
export default function Loading() {
  return (
    <div className="w-full overflow-hidden" role="status" aria-live="polite">
      <span className="sr-only">Loading Cinevide…</span>

      <div className="relative min-h-[80vh] w-full sm:min-h-[88vh]">
        <div className="skeleton absolute inset-0 rounded-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-night via-night/50 to-transparent" />
        <div className="absolute bottom-20 left-4 flex w-[min(36rem,85vw)] flex-col gap-4 sm:left-10 md:bottom-24">
          <div className="skeleton h-4 w-40 rounded-full" />
          <div className="skeleton h-14 w-4/5 rounded-xl" />
          <div className="skeleton h-4 w-3/5 rounded-full" />
          <div className="space-y-2">
            <div className="skeleton h-3 w-full rounded-full" />
            <div className="skeleton h-3 w-11/12 rounded-full" />
          </div>
          <div className="mt-2 flex gap-3">
            <div className="skeleton h-12 w-36 rounded-xl" />
            <div className="skeleton h-12 w-36 rounded-xl" />
          </div>
        </div>
      </div>

      {[0, 1].map((row) => (
        <div key={row} className="py-5">
          <div className="skeleton mx-4 mb-4 h-5 w-48 rounded-full md:mx-10" />
          <div className="flex gap-3 px-4 md:gap-4 md:px-10">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="skeleton aspect-[2/3] w-[44%] flex-none rounded-xl sm:w-[188px] md:w-[184px] lg:w-[200px] xl:w-[212px]"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
