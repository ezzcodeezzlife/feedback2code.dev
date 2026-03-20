"use client";

import { Toaster } from "sonner";

export function SonnerToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        // Match toast visuals to the same flat surface + border style
        // used across shared UI primitives.
        unstyled: true,
        classNames: {
          toast:
            "group relative flex w-full min-w-[360px] items-start justify-between gap-3 overflow-hidden border border-border bg-surface px-4 py-3.5 pr-10 text-foreground outline-none transition-all duration-150 before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] before:bg-accent/70 data-[visible=true]:animate-in data-[visible=true]:fade-in-0",
          content: "grid gap-1 pt-0.5",
          title:
            "text-xs font-bold uppercase tracking-wider text-foreground leading-4",
          description: "text-sm leading-relaxed text-muted",
          closeButton:
            "absolute right-2.5 top-2.5 p-1 text-muted opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-1 focus:ring-accent/30",
          actionButton:
            "inline-flex h-7 items-center justify-center border border-accent bg-accent px-2.5 text-[11px] font-bold uppercase tracking-wider text-black transition-colors hover:bg-accent-hover focus:outline-none focus:ring-1 focus:ring-accent/30",
          cancelButton:
            "inline-flex h-7 items-center justify-center border border-border-bright bg-transparent px-2.5 text-[11px] font-bold uppercase tracking-wider text-foreground transition-colors hover:border-accent hover:text-accent focus:outline-none focus:ring-1 focus:ring-accent/30",
          icon: "text-accent",
          loader: "text-accent",
          default: "before:bg-accent/70",
          success: "border-accent/40 bg-accent/10 before:bg-accent",
          error: "border-red-900/50 bg-red-950/20 before:bg-red-400",
          warning: "border-amber-900/50 bg-amber-950/20 before:bg-amber-400",
          info: "border-border-bright bg-background before:bg-border-bright",
        },
      }}
    />
  );
}
