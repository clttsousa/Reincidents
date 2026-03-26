import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.04em] transition-all duration-200",
  {
    variants: {
      variant: {
        default: [
          "border-transparent bg-[linear-gradient(135deg,#0f172a,#1e293b)] text-white",
          "shadow-[0_12px_24px_-20px_rgba(15,23,42,0.45)]",
          "dark:bg-[linear-gradient(135deg,#4f46e5,#6366f1)]",
          "dark:shadow-[0_12px_24px_-20px_rgba(99,102,241,0.4)]",
        ].join(" "),
        secondary: [
          "border-transparent bg-slate-100 text-slate-700",
          "dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700/50",
        ].join(" "),
        outline: [
          "border-slate-200/90 bg-white/95 text-slate-700",
          "shadow-[0_10px_24px_-24px_rgba(15,23,42,0.18)]",
          "dark:border-slate-700/60 dark:bg-slate-800/60 dark:text-slate-300",
        ].join(" "),
        success: [
          "border-emerald-200/80 bg-emerald-50 text-emerald-700",
          "dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300",
        ].join(" "),
        warning: [
          "border-amber-200/80 bg-amber-50 text-amber-700",
          "dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300",
        ].join(" "),
        destructive: [
          "border-rose-200/80 bg-rose-50 text-rose-700",
          "dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300",
        ].join(" "),
        info: [
          "border-blue-200/80 bg-blue-50 text-blue-700",
          "dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300",
        ].join(" "),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
