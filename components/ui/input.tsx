import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";
import { forwardRef } from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type, ...props },
  ref,
) {
  return (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-9 w-full rounded-md border border-black/15 bg-transparent px-3 py-2 text-sm outline-none ring-0 placeholder:text-zinc-400 focus:border-black/30 dark:border-white/20 dark:focus:border-white/40 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});

export default Input;

