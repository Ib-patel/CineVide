/**
 * Re-mounts on every navigation. Opacity-only (no movement): route changes are
 * frequent, so the entrance must be quick and never feel like it's in the way.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
