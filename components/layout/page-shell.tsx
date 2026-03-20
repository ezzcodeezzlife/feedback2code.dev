import type { ReactNode } from "react";

export function PageShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main
      className={`mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-8 ${className ?? ""}`}
    >
      {children}
    </main>
  );
}

export function PagePanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "w-full border border-border bg-surface",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}
