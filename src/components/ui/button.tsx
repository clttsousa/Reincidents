import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 outline-none disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-4 focus-visible:ring-ring/60",
  {
    variants: {
      variant: {
        default: "bg-slate-950 text-white shadow-sm hover:bg-slate-900",
        outline: "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
        secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200/80",
        ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-[13px]",
        lg: "h-11 rounded-xl px-6",
        icon: "size-10",
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
    return <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
