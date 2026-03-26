import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.04em] transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[linear-gradient(135deg,#0f172a,#1e293b)] text-white shadow-[0_12px_24px_-20px_rgba(15,23,42,0.45)]",
        secondary: "border-transparent bg-slate-100 text-slate-700",
        outline: "border-slate-200/90 bg-white/95 text-slate-700 shadow-[0_10px_24px_-24px_rgba(15,23,42,0.18)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
