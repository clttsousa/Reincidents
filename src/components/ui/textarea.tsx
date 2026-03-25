import * as React from "react";

import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-[132px] w-full rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-3 text-sm text-slate-900 shadow-[0_10px_25px_-20px_rgba(15,23,42,0.5)] outline-none placeholder:text-slate-400 focus-visible:border-slate-300 focus-visible:ring-4 focus-visible:ring-ring/60 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
