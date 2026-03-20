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
        "flex h-9 w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none ring-0 focus:border-black/30 dark:border-white/20 dark:focus:border-white/40",
        className,
      )}
      {...props}
    />
  );
});

export default Select;

