import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-black",
        className,
      )}
      {...props}
    />
  );
}

