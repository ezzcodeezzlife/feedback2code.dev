import { cn } from "@/lib/utils";
import type { SelectHTMLAttributes } from "react";
import { forwardRef } from "react";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(
        "flex h-9 w-full appearance-none border border-border bg-surface pl-3 pr-10 py-2 text-sm text-foreground outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/30",
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 8 4 4 4-4'/%3E%3C/svg%3E\")",
        backgroundRepeat: "no-repeat",
        backgroundSize: "14px 14px",
        backgroundPosition: "right 0.65rem center",
      }}
      {...props}
    />
  );
});

export default Select;
