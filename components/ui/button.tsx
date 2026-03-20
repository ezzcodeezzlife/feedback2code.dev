import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-white/20",
  {
    variants: {
      variant: {
        default:
          "bg-black text-white hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80",
        outline:
          "border border-black/15 bg-transparent hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10",
        ghost: "bg-transparent hover:bg-black/5 dark:hover:bg-white/10",
      },
      size: {
        default: "h-9 px-3 py-2",
        sm: "h-8 rounded-md px-3",
        lg: "h-10 rounded-md px-4",
        icon: "h-8 w-8 p-0",
        iconLg: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export { buttonVariants };

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export default function Button({
  className,
  variant,
  size,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

