import type { ReactNode } from "react";

/**
 * Shared outer width + padding for dashboard-style pages (matches across routes).
 */
export function PageShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main
      className={`mx-auto flex w-full max-w-5xl flex-1 px-6 py-10 ${className ?? ""}`}
    >
      {children}
    </main>
  );
}

/**
 * Shared card panel inside PageShell.
 */
export function PagePanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`w-full rounded-xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-black ${className ?? ""}`}
    >
      {children}
    </section>
  );
}
