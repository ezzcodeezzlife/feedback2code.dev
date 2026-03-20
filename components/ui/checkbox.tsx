import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

export type CheckboxProps = InputHTMLAttributes<HTMLInputElement>;

export default function Checkbox({
  className,
  ...props
}: CheckboxProps) {
  return (
    <input
      type="checkbox"
      className={cn("h-4 w-4 accent-black dark:accent-white", className)}
      {...props}
    />
  );
}

