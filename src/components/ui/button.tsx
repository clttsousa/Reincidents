import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium transition-all duration-200 outline-none disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-4 focus-visible:ring-ring/70 active:scale-[0.985]",
  {
    variants: {
      variant: {
        default: [
          "bg-[linear-gradient(135deg,#0f172a,#1e293b)] text-white",
          "shadow-[0_16px_34px_-22px_rgba(15,23,42,0.55)]",
          "hover:-translate-y-0.5 hover:shadow-[0_22px_38px_-24px_rgba(15,23,42,0.48)]",
          "dark:bg-[linear-gradient(135deg,#4f46e5,#6366f1)]",
          "dark:shadow-[0_16px_34px_-22px_rgba(99,102,241,0.45)]",
          "dark:hover:shadow-[0_22px_38px_-24px_rgba(99,102,241,0.55)]",
        ].join(" "),
        outline: [
          "border border-slate-200/90 bg-white/95 text-slate-700",
          "shadow-[0_12px_28px_-22px_rgba(15,23,42,0.18)]",
          "hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950",
          "dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-300",
          "dark:hover:border-slate-600 dark:hover:bg-slate-700/80 dark:hover:text-slate-100",
        ].join(" "),
        secondary: [
          "border border-transparent bg-slate-100 text-slate-700",
          "hover:-translate-y-0.5 hover:bg-slate-200/80",
          "dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700/80",
        ].join(" "),
        ghost: [
          "text-slate-600 hover:bg-slate-100/90 hover:text-slate-950",
          "dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-slate-100",
        ].join(" "),
        destructive: [
          "bg-rose-500 text-white shadow-[0_16px_34px_-22px_rgba(244,63,94,0.45)]",
          "hover:-translate-y-0.5 hover:bg-rose-600",
          "dark:bg-rose-600 dark:hover:bg-rose-500",
        ].join(" "),
      },
      size: {
        default: "h-11 px-4 py-2.5",
        sm: "h-9 rounded-xl px-3 text-[13px]",
        lg: "h-12 rounded-2xl px-6 text-[15px]",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
