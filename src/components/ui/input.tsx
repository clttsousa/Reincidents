import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-2xl border px-4 py-2.5 text-sm transition-all duration-200",
          "bg-white/95 text-slate-950 placeholder:text-slate-400",
          "border-slate-200/90 shadow-[0_2px_8px_-4px_rgba(15,23,42,0.08)]",
          "focus:border-blue-400/70 focus:ring-4 focus:ring-blue-500/12 focus:shadow-[0_4px_16px_-6px_rgba(59,130,246,0.2)]",
          "hover:border-slate-300",
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Dark mode
          "dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500",
          "dark:border-slate-700/60",
          "dark:focus:border-indigo-500/60 dark:focus:ring-indigo-500/15",
          "dark:hover:border-slate-600",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
