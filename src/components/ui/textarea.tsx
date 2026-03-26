import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[132px] w-full rounded-[22px] border px-4 py-3 text-sm outline-none transition-all duration-200",
          "border-slate-200/90 bg-white/95 text-slate-900 placeholder:text-slate-400",
          "shadow-[0_2px_8px_-4px_rgba(15,23,42,0.08)]",
          "focus-visible:-translate-y-px focus-visible:border-blue-400/70 focus-visible:ring-4 focus-visible:ring-blue-500/12",
          "hover:border-slate-300",
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Dark mode
          "dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500",
          "dark:focus-visible:border-indigo-500/60 dark:focus-visible:ring-indigo-500/15",
          "dark:hover:border-slate-600",
          className,
        )}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
