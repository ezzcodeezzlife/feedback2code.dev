import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";

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
    <Card className={["w-full", className ?? ""].filter(Boolean).join(" ")}>
      {children}
    </Card>
  );
}
